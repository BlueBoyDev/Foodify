// RUTA: src/modules/notifications/notifications.service.ts
// Push notifications via Firebase FCM Admin SDK.
// Solo Plan Premium — App Android (waiter, chef, cashier, restaurant_admin).
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { User, UserRole }   from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Enviar push notification a uno o varios dispositivos Android.
   */
  async sendPush(
    fcmTokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = Array.isArray(fcmTokens) ? fcmTokens : [fcmTokens];
    const validTokens = tokens.filter(t => !!t);

    if (validTokens.length === 0) {
      this.logger.warn('sendPush: No hay tokens válidos, notificación omitida');
      return;
    }

    try {
      // TODO: Firebase Admin SDK Integration (requiere serviceAccountKey.json)
      // const message = {
      //   notification: { title, body },
      //   data,
      //   tokens: validTokens,
      // };
      // await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(`[FCM] Push intentado para ${validTokens.length} dispositivos: ${title}`);
    } catch (err) {
      this.logger.error(`[FCM] Error enviando push: ${err.message}`);
    }
  }

  /**
   * Notifica a TODOS los meseros cuando entra un pedido "Para Llevar" (PWA).
   * Solo el primero que acepte (claim) se quedará con el pedido.
   */
  async notifyNewTakeoutOrder(restaurantId: number, orderId: number, orderNumber: string) {
    this.logger.log(`[NotificationsService|TAKEOUT] Buscando meseros para restaurantId=${restaurantId}`);
    // 1. Buscar todos los meseros activos de este restaurante que tengan token FCM
    const waiters = await this.userRepository.find({
      where: {
        restaurant: { id: restaurantId },
        role: UserRole.WAITER,
        isActive: true,
      },
      select: ['id', 'fullName', 'fcmToken'],
    });

    this.logger.log(`[NotificationsService|TAKEOUT] Meseros encontrados en DB: ${waiters.length}`);
    waiters.forEach(w => {
        this.logger.debug(`Mesero: ${w.fullName} (ID: ${w.id}), Token: ${w.fcmToken ? 'PRESENTE' : 'AUSENTE'}`);
    });

    const tokens = waiters.map(w => w.fcmToken).filter(t => !!t);
    this.logger.log(`[NotificationsService|TAKEOUT] Total tokens FCM para enviar: ${tokens.length}`);

    if (tokens.length === 0) {
      this.logger.warn(`No se enviará PUSH: No hay meseros con FCM en restaurantId=${restaurantId}`);
      return;
    }

    await this.sendPush(
      tokens as string[],
      '📦 Nuevo pedido Para Llevar',
      `¡Entró la orden #${orderNumber}! Pulsa para aceptar y atender.`,
      { 
        type: 'NEW_TAKEOUT_ORDER', 
        orderId: String(orderId), 
        orderNumber 
      },
    );
  }

  /**
   * Notifica al mesero cuando su pedido está listo.
   * Disparado por: trigger MySQL after_order_item_status_update
   *   → KitchenService.checkAllItemsReady()
   */
  async notifyOrderReady(fcmToken: string, orderId: number, tableNumber: number | null) {
    await this.sendPush(
      fcmToken,
      '🍽 Pedido listo para entregar',
      `La orden #${String(orderId).padStart(4,'0')}${tableNumber ? ` (Mesa ${tableNumber})` : ''} está lista.`,
      { orderId: String(orderId), tableNumber: String(tableNumber ?? '') },
    );
  }

  /**
   * Notifica al admin cuando hay alerta de stock bajo.
   * Disparado por: InventoryService.createAdjustment() o trigger FIFO.
   */
  async notifyLowStock(fcmToken: string, itemName: string, currentStock: number, unit: string) {
    await this.sendPush(
      fcmToken,
      '⚠️ Stock bajo en inventario',
      `"${itemName}" tiene solo ${currentStock} ${unit} disponibles.`,
      { alertType: 'low_stock', itemName, currentStock: String(currentStock) },
    );
  }

  /**
   * Notifica al admin cuando un insumo está próximo a caducar.
   * Jorge: "Alertas de Caducidad — flag alerta:true"
   */
  async notifyExpiringSoon(fcmToken: string, itemName: string, expiryDate: Date) {
    const days = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    await this.sendPush(
      fcmToken,
      '📅 Insumo próximo a caducar',
      `"${itemName}" caduca en ${days} día${days !== 1 ? 's' : ''}.`,
      { alertType: 'expiring_soon', itemName, daysLeft: String(days) },
    );
  }
}
