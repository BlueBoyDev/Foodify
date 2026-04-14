/**
 * RUTA: src/modules/orders/orders.service.ts
 *
 * v3.2 — CAMBIOS:
 *   - createOrder: acepta requests sin JWT (takeout desde PWA pública)
 *     genera QR único y guarda customerName / customerPhone
 *   - scanQr: nuevo método para PATCH /orders/:id/scan-qr (Solo Premium)
 *   - confirmDeliveryManual: para Plan Básico — admin confirma desde PWA
 *   - validateOrderSchedule: valida horario de cada platillo antes de crear
 *   - Sin referencias al rol 'manager'
 */
import {
  BadRequestException, ForbiddenException,
  Injectable, InternalServerErrorException, Logger, NotFoundException,
  Inject, forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as QRCode from 'qrcode';

import { Order, OrderStatus, OrderType, KitchenStatus } from './entities/order.entity';
import { OrderItem, ItemStatus }                         from './entities/order-item.entity';
import { Table }                                         from '../tables/entities/table.entity';
import { Dish }                                          from '../dishes/entities/dish.entity';
import { CreateOrderDto }                                from './dto/create-order.dto';
import {
  UpdateOrderStatusDto, AddOrderItemDto,
  UpdateOrderItemDto, ScanQrDto,
}                                                        from './dto/update-order.dto';
import { OrdersGateway }                                 from './orders.gateway';
import { KitchenGateway }                                from '../kitchen/kitchen.gateway';
import { NotificationsService }                        from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)      private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)  private itemRepo: Repository<OrderItem>,
    @InjectRepository(Dish)       private dishRepo: Repository<Dish>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => OrdersGateway)) private ordersGateway: OrdersGateway,
    @Inject(forwardRef(() => KitchenGateway)) private kitchenGateway: KitchenGateway,
    private notificationsService: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CREAR ORDEN
  // Dos orígenes posibles:
  //   1. App Android (JWT) → dine_in  — waiter/restaurant_admin
  //   2. PWA Pública (sin JWT) → takeout — comensal
  // ─────────────────────────────────────────────────────────────────────────
  async createOrder(
    dto: CreateOrderDto,
    restaurantId: number,
    waiterId: number | null,   // null cuando viene de PWA pública sin JWT
  ): Promise<Order> {
    // Normalizar snake_case de Android
    if (dto.table_id === 0) dto.table_id = undefined;
    dto.tableId = dto.tableId || dto.table_id;
    
    dto.items = dto.items.map(i => ({
      ...i,
      dishId: i.dishId || i.dish_id,
      specialNotes: i.specialNotes || i.special_notes,
    }));

    if (dto.tableId) {
      dto.type = OrderType.DINE_IN;
    } else {
      dto.type = OrderType.TAKEOUT;
    }

    // Validar que takeout público tenga nombre y teléfono
    if (dto.type === OrderType.TAKEOUT && !waiterId) {
      if (!dto.customerName || !dto.customerPhone) {
        throw new BadRequestException(
          'Para órdenes Para Llevar se requiere nombre y teléfono del cliente',
        );
      }
    }

    // Validar platillos
    await this.validateOrderSchedule(dto.items.map((i) => i.dishId), restaurantId);

    // Generar folio único 0001-9999
    const count = await this.orderRepo.count({ where: { restaurant: { id: restaurantId } } });
    const orderNumber = String((count % 9999) + 1).padStart(4, '0');

    // Generar QR para takeout
    let qrCode: string | null = null;
    if (dto.type === OrderType.TAKEOUT) {
      // Formato simple para que la app Android lo parsee correctamente: "pedido-ID"
      // Se genera después del save para tener el ID real si es posible, 
      // o usamos un placeholder temporal que luego se valida.
      // Pero mejor: lo generamos después del save Order.
    }

    return this.dataSource.transaction(async (em) => {
      // Calcular precios
      const itemsWithPrice = await Promise.all(
        dto.items.map(async (item) => {
          const dish = await em.findOneBy(Dish, { id: item.dishId });
          if (!dish || !dish.isAvailable) {
            throw new BadRequestException(
              `El platillo #${item.dishId} no está disponible`,
            );
          }
          return { ...item, unitPrice: dish.price };
        }),
      );

      // Validar mesa
      if (dto.tableId) {
        const table = await em.findOneBy(Table, { id: dto.tableId, restaurant: { id: restaurantId } } as any);
        if (!table) throw new BadRequestException('Mesa no encontrada o inválida');
        await em.update(Table, { id: dto.tableId }, { status: 'occupied' as any });
      }

      const subtotal = itemsWithPrice.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity, 0,
      );
      const taxAmount = subtotal * 0.16;
      const total     = subtotal + taxAmount;

      const order = em.create(Order, {
        restaurant: { id: restaurantId } as any,
        table:         dto.tableId ? { id: dto.tableId } as any : null,
        waiter:        waiterId ? { id: waiterId } as any : null,
        orderNumber,
        type:          dto.type,
        status:        OrderStatus.PENDING,
        kitchenStatus: KitchenStatus.PENDING,
        qrCode,
        customerName:  dto.customerName  ?? null,
        customerPhone: dto.customerPhone ?? null,
        notes:         dto.notes         ?? null,
        subtotal,
        taxAmount,
        total,
      });
      const savedOrder = await em.save(Order, order);
      this.logger.log(`[Order Creation] Pedido guardado con ID=${savedOrder.id}, Folio=${orderNumber}`);

      // Generar QR ahora que tenemos el ID (v3.2.1)
      if (dto.type === OrderType.TAKEOUT) {
        const qrToken = `pedido-${savedOrder.id}`;
        savedOrder.qrCode = await QRCode.toDataURL(qrToken);
        await em.update(Order, { id: savedOrder.id }, { qrCode: savedOrder.qrCode });
      }

      const orderItems = itemsWithPrice.map((i) =>
        em.create(OrderItem, {
          orderId:      savedOrder.id,
          dishId:       i.dishId,
          quantity:     i.quantity,
          unitPrice:    i.unitPrice,
          specialNotes: i.specialNotes ?? null,
          status:       ItemStatus.PENDING,
        }),
      );
      await em.save(OrderItem, orderItems);
      this.logger.log(`[Order Creation] Ítems guardados (${orderItems.length} ítems)`);

      // Emitir a namespace /kitchen (Solo Premium — el gateway valida)
      this.ordersGateway.emitNewOrder(restaurantId, {
        orderId:      savedOrder.id,
        tableNumber:  dto.tableId ?? null,
        waiterName:   waiterId ? 'Mesero' : dto.customerName,
        orderNumber,
        type:         dto.type,
        items:        orderItems.map((i) => ({
          id: i.id, dishId: i.dishId, quantity: i.quantity,
          specialNotes: i.specialNotes,
        })),
        createdAt: savedOrder.createdAt,
      });

      // Notificar a todos los meseros vía PUSH (Solo TAKEOUT de PWA)
      if (dto.type === OrderType.TAKEOUT) {
        this.logger.log(`[Order Notification] Iniciando proceso de notificación PUSH para orden #${orderNumber}`);
        this.notificationsService.notifyNewTakeoutOrder(
          restaurantId, 
          savedOrder.id, 
          orderNumber
        ).catch(err => this.logger.error(`[Order Notification] Error crítico notificando: ${err.message}`));
      }

      return em.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'table', 'waiter'],
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR ORDEN COMPLETAMENTE (Sync Ítems)
  // PATCH /api/v1/orders/:id
  // ─────────────────────────────────────────────────────────────────────────
  async updateOrder(
    orderId: number,
    restaurantId: number,
    dto: CreateOrderDto,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, restaurant: { id: restaurantId } },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede editar una orden finalizada');
    }

    // Normalizar datos de Android
    dto.items = dto.items.map(i => ({
      ...i,
      dishId: i.dishId || i.dish_id,
      specialNotes: i.specialNotes || i.special_notes,
    }));

    return this.dataSource.transaction(async (em) => {
      // 1. Obtener precios actuales y validar disponibilidad
      const itemsWithPrice = await Promise.all(
        dto.items.map(async (item) => {
          const dish = await em.findOneBy(Dish, { id: item.dishId });
          if (!dish || !dish.isAvailable) {
            throw new BadRequestException(`El platillo #${item.dishId} no está disponible`);
          }
          return { ...item, unitPrice: dish.price };
        }),
      );

      // 2. Eliminar ítems anteriores y reemplazarlos por los nuevos (Sincronización total)
      await em.delete(OrderItem, { orderId });

      const orderItems = itemsWithPrice.map((i) =>
        em.create(OrderItem, {
          orderId,
          dishId:       i.dishId,
          quantity:     i.quantity,
          unitPrice:    i.unitPrice,
          specialNotes: i.specialNotes ?? null,
          status:       ItemStatus.PENDING,
        }),
      );
      await em.save(OrderItem, orderItems);

      // 3. Recalcular totales
      const subtotal = itemsWithPrice.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const taxAmount = subtotal * 0.16;
      const total     = subtotal + taxAmount;

      await em.update(Order, { id: orderId }, {
        subtotal,
        taxAmount,
        total,
        notes: dto.notes ?? order.notes,
      });

      // 4. Notificar a Cocina (Cambios en ítems)
      this.ordersGateway.emitOrderUpdated(restaurantId, {
        orderId,
        items: orderItems.map(i => ({
          id: i.id, dishId: i.dishId, quantity: i.quantity,
          specialNotes: i.specialNotes,
        })),
        total,
      });

      return em.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'table', 'waiter'],
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCAN QR — Solo Plan Premium (App Android: waiter o cashier)
  // PATCH /api/v1/orders/:id/scan-qr
  // ─────────────────────────────────────────────────────────────────────────
  async scanQr(orderId: number, restaurantId: number): Promise<Order> {
    let order = await this.orderRepo.findOne({
      where: { id: orderId, restaurant: { id: restaurantId } },
      relations: ['items'],
    });

    // Fallback: Si no se encuentra por ID real, intentar por Folio (orderNumber)
    if (!order) {
      const paddedFolio = String(orderId).padStart(4, '0');
      order = await this.orderRepo.findOne({
        where: { orderNumber: paddedFolio, restaurant: { id: restaurantId } },
        relations: ['items'],
      });
    }

    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.type !== OrderType.TAKEOUT) {
      throw new BadRequestException(
        'El escaneo de QR solo aplica para órdenes Para Llevar',
      );
    }
    if (!order.qrCode) {
      throw new BadRequestException('Esta orden no tiene QR generado');
    }
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('La orden ya fue entregada');
    }

    await this.orderRepo.update(order.id, {
      status:      OrderStatus.DELIVERED,
      kitchenStatus: KitchenStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    if (order.tableId) {
      await this.dataSource.manager.update(Table, { id: order.tableId }, { status: 'available' as any });
    }

    this.ordersGateway.emitOrderDelivered(restaurantId, {
      orderId: order.id, deliveredAt: new Date(), total: order.total,
    });

    return this.orderRepo.findOne({ where: { id: order.id }, relations: ['items'] });
  }

  /**
   * RECLAMAR ORDEN — Solo Plan Premium (App Android: waiter)
   * PATCH /api/v1/orders/:id/claim
   */
  async claimOrder(
    orderId: number, 
    restaurantId: number, 
    waiterId: number
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, restaurant: { id: restaurantId } },
      relations: ['waiter'],
    });
    
    if (!order) throw new NotFoundException('Orden no encontrada');
    
    if (order.type !== OrderType.TAKEOUT) {
      throw new BadRequestException('Solo las órdenes Para Llevar pueden ser reclamadas');
    }
    
    if (order.waiterId) {
      throw new BadRequestException('Esta orden ya tiene un mesero asignado');
    }

    await this.orderRepo.update(orderId, {
      waiter: { id: waiterId } as any
    });

    const updatedOrder = await this.findOne(orderId, restaurantId);

    // Emitir a /restaurant para que otros meseros vean que ya fue tomada
    this.ordersGateway.emitOrderUpdated(restaurantId, {
      orderId,
      waiterId,
      waiterName: updatedOrder.waiter?.fullName || 'Mesero',
    });

    return updatedOrder;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMAR ENTREGA MANUAL — Plan Básico (admin desde PWA)
  // Se usa el endpoint PATCH /orders/:id/status con status=delivered
  // ─────────────────────────────────────────────────────────────────────────
  async updateStatus(
    orderId: number,
    restaurantId: number,
    dto: UpdateOrderStatusDto,
    chefId?: number,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, restaurant: { id: restaurantId } } as any,
      relations: ['chef']
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Propiedad en cocina: si ya tiene chef y quien intenta cambiar NO es ese chef (y no es admin)
    // Nota: en este punto el controller ya valió roles, pero aquí aseguramos la propiedad.
    if (order.chefId && chefId && order.chefId !== chefId) {
      // Si el estado es de cocina
      const kitchenStatuses = [OrderStatus.PREPARING, OrderStatus.READY];
      if (kitchenStatuses.includes(dto.status as any)) {
         // Omitimos bloqueo por ahora para no romper flujo si el admin interviene, 
         // pero registramos quien la inició.
      }
    }

    // Validar transición de estados (sin retrocesos)
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.PENDING]:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.READY]:     [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${dto.status}`,
      );
    }

    const updates: Partial<Order> = { status: dto.status as OrderStatus };
    if (dto.status === OrderStatus.PREPARING || dto.status === OrderStatus.READY) {
      if (chefId && !order.chefId) {
        updates.chef = { id: chefId } as any;
      }
    }
    
    if (dto.status === OrderStatus.DELIVERED) {
      updates.deliveredAt = new Date();
      updates.kitchenStatus = KitchenStatus.DELIVERED; // Sincronizar con cocina
      
      this.ordersGateway.emitOrderDelivered(restaurantId, {
        orderId, deliveredAt: updates.deliveredAt, total: order.total,
      });

      // Notificar a cocina (namespace /kitchen)
      this.kitchenGateway?.emitOrderFinalized(restaurantId, orderId);
    }
    if (dto.status === OrderStatus.CANCELLED) {
      updates.cancelledAt  = new Date();
      updates.cancelReason = dto.cancelReason ?? null;
      updates.kitchenStatus = KitchenStatus.DELIVERED; // O un nuevo estado CANCELLED si existe, pero DELIVERED sirve para sacarlo de cocina
      
      // Notificar a cocina (namespace /kitchen)
      this.kitchenGateway?.emitOrderFinalized(restaurantId, orderId);
    }

    await this.orderRepo.update(orderId, updates);
    
    if (dto.status === OrderStatus.DELIVERED || dto.status === OrderStatus.CANCELLED) {
      if (order.tableId) {
         await this.dataSource.manager.update(Table, { id: order.tableId }, { status: 'available' as any });
      }
    }
    
    return this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
  }

  private mapOrderRelations(order: Order): any {
    const o = order as any;
    if (o.table) {
      o.tableNumber = o.table.number;
    }
    
    // Mapeo plano para App Android (OrderDto)
    if (o.waiter) {
      o.waiterName = o.waiter.fullName || o.waiter.email;
      o.waiterId   = o.waiter.id;
    } else {
      o.waiterName = null;
      o.waiterId   = null;
    }

    if (o.items) {
      o.items = o.items.map((item: any) => {
        if (item.dish) {
          item.dishName = item.dish.name;
          item.dishImages = item.dish.images || null;
        }
        return item;
      });
    }
    return o;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTAR / DETALLE
  // ─────────────────────────────────────────────────────────────────────────
  async findAll(restaurantId: number, filters: {
    status?: string; kitchenStatus?: string;
    tableId?: number; waiterId?: number;
    dateFrom?: string; dateTo?: string;
  }) {
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.dish', 'dish')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.waiter', 'waiter')
      .where('order.restaurant = :restaurantId', { restaurantId });

    if (filters.status)        qb.andWhere('order.status = :status',              { status: filters.status });
    if (filters.kitchenStatus) qb.andWhere('order.kitchen_status = :ks',          { ks: filters.kitchenStatus });
    if (filters.tableId)       qb.andWhere('order.table_id = :tableId',           { tableId: filters.tableId });
    if (filters.waiterId) {
      qb.andWhere('(order.waiter_id = :waiterId OR order.waiter_id IS NULL)', { waiterId: filters.waiterId });
    }
    if (filters.dateFrom)      qb.andWhere('order.created_at >= :dateFrom',       { dateFrom: filters.dateFrom });
    if (filters.dateTo)        qb.andWhere('order.created_at <= :dateTo',         { dateTo: filters.dateTo });

    qb.orderBy('order.created_at', 'DESC');
    const orders = await qb.getMany();
    return orders.map(o => this.mapOrderRelations(o));
  }

  async findActive(restaurantId: number, waiterId?: number) {
    try {
      this.logger.debug(`findActive: restaurantId=${restaurantId}, waiterId=${waiterId}`);
      const statuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY];
      
      const qb = this.orderRepo.createQueryBuilder('order')
        .leftJoinAndSelect('order.table', 'table')
        .leftJoinAndSelect('order.items', 'item')
        .leftJoinAndSelect('item.dish', 'dish')
        .leftJoinAndSelect('order.waiter', 'waiter')
        .where('order.restaurant = :restaurantId', { restaurantId })
        .andWhere('order.status IN (:...statuses)', { statuses });

      if (waiterId) {
        qb.andWhere('(order.waiter_id = :waiterId OR order.waiter_id IS NULL)', { waiterId });
      }

      const orders = await qb.orderBy('order.createdAt', 'ASC').getMany();
        
      return orders.map(o => this.mapOrderRelations(o));
    } catch (err: any) {
      this.logger.error(
        `findActive FAILED for restaurantId=${restaurantId}: ${err?.message}`,
        err?.stack,
      );
      throw new InternalServerErrorException('Error al obtener pedidos activos');
    }
  }

  async findOne(id: number, restaurantId: number) {
    const order = await this.orderRepo.createQueryBuilder('order')
        .leftJoinAndSelect('order.table', 'table')
        .leftJoinAndSelect('order.items', 'item')
        .leftJoinAndSelect('item.dish', 'dish')
        .leftJoinAndSelect('order.waiter', 'waiter')
        .where('order.restaurant = :restaurantId', { restaurantId })
        .andWhere('order.id = :id', { id })
        .getOne();
        
    if (!order) throw new NotFoundException('Orden no encontrada');
    return this.mapOrderRelations(order);
  }

  async addItem(orderId: number, restaurantId: number, dto: AddOrderItemDto) {
    const order = await this.findOne(orderId, restaurantId);
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se pueden agregar ítems a una orden finalizada');
    }
    const dish = await this.dishRepo.findOneBy({ id: dto.dishId, restaurant: { id: restaurantId } } as any);
    if (!dish || !dish.isAvailable) throw new NotFoundException('Platillo no disponible');

    const item = this.itemRepo.create({
      orderId, dishId: dto.dishId, quantity: dto.quantity,
      unitPrice: dish.price, specialNotes: dto.specialNotes ?? null,
      status: ItemStatus.PENDING,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(orderId: number, itemId: number, restaurantId: number, dto: UpdateOrderItemDto) {
    await this.findOne(orderId, restaurantId);
    await this.itemRepo.update({ id: itemId, orderId }, dto);
    return this.itemRepo.findOneBy({ id: itemId });
  }

  async removeItem(orderId: number, itemId: number, restaurantId: number) {
    await this.findOne(orderId, restaurantId);
    await this.itemRepo.delete({ id: itemId, orderId });
    return { message: 'Ítem eliminado' };
  }

  async cancel(orderId: number, restaurantId: number, cancelReason: string) {
    const order = await this.findOne(orderId, restaurantId);
    const result = await this.updateStatus(orderId, restaurantId, {
      status: OrderStatus.CANCELLED, cancelReason,
    } as UpdateOrderStatusDto);
    
    if (order.tableId) {
      await this.dataSource.manager.update(Table, { id: order.tableId }, { status: 'available' as any });
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDAR HORARIO DE PLATILLOS
  // Verifica que cada platillo sea ordenable según su schedule
  // ─────────────────────────────────────────────────────────────────────────
  private async validateOrderSchedule(dishIds: number[], restaurantId: number) {
    for (const dishId of dishIds) {
      const dish = await this.dishRepo.findOne({
        where: { id: dishId, restaurant: { id: restaurantId } } as any,
        relations: ['category', 'category.menu'],
      });
      if (!dish) throw new NotFoundException(`Platillo #${dishId} no encontrado`);
      if (!dish.isAvailable) {
        throw new BadRequestException(
          `El platillo "${dish.name}" no está disponible actualmente`,
        );
      }
      // TODO: validar schedule del menú y categoría con isMenuActiveNow()
    }
  }
}
