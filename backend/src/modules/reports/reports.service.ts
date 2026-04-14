// RUTA: src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Dish } from '../dishes/entities/dish.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)     private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo:  Repository<OrderItem>,
    @InjectRepository(Dish)      private dishRepo:  Repository<Dish>,
    @InjectRepository(User)      private userRepo:  Repository<User>,
  ) {}

  /**
   * Obtiene las ventas diarias de la última semana (7 días)
   */
  async getWeeklySales(restaurantId: number) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const results = [];
    
    // Obtenemos los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const statuses = [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED];

      const stats = await this.orderRepo
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.restaurant_id = :rid', { rid: restaurantId })
        .andWhere('order.status IN (:...statuses)', { statuses })
        .andWhere('order.created_at BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
        .getRawOne();

      results.push({
        day: dayName,
        amount: parseFloat(stats?.total || 0)
      });
    }

    return results;
  }

  /**
   * Obtiene el Top X de platillos más vendidos
   */
  async getTopDishes(restaurantId: number, limit: number = 3) {
    const statuses = [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED];

    const rawData = await this.itemRepo
      .createQueryBuilder('oi')
      .select('dish.name', 'name')
      .addSelect('SUM(oi.quantity)', 'quantity')
      .innerJoin('oi.order', 'order')
      .innerJoin('oi.dish', 'dish')
      .where('order.restaurant_id = :rid', { rid: restaurantId })
      .andWhere('order.status IN (:...statuses)', { statuses })
      .groupBy('dish.id')
      .orderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany();

    // Colores por defecto para la gráfica si no tienen uno específico
    const colors = ['#FF6B35', '#F59E0B', '#3B82F6', '#10B981', '#6366F1'];

    return rawData.map((d, index) => ({
      name: d.name,
      quantity: parseInt(d.quantity) || 0,
      color: colors[index % colors.length]
    }));
  }

  /**
   * Obtiene métricas de rendimiento por empleado (meseros)
   * Filtra por restaurante y opcionalmente por período
   */
  async getStaffMetrics(restaurantId: number, period: string = 'month') {
    // 1. Obtener todos los meseros y admins del restaurante
    const staff = await this.userRepo.find({
      where: { 
        restaurant: { id: restaurantId },
        role: UserRole.WAITER // Filtramos por meseros para este reporte específico
      },
      select: ['id', 'fullName', 'role'],
    });

    // 2. Calcular métricas para cada uno
    const metrics = await Promise.all(
      staff.map(async (member) => {
        // Contar órdenes entregadas por este usuario
        const stats = await this.orderRepo
          .createQueryBuilder('order')
          .select('COUNT(order.id)', 'count')
          .addSelect('SUM(order.total)', 'revenue')
          .where('order.restaurant_id = :rid', { rid: restaurantId })
          .andWhere('order.waiter_id = :uid', { uid: member.id })
          .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
          .getRawOne();

        return {
          waiterId:     member.id,
          waiterName:   member.fullName || 'Empleado Sin Nombre',
          orderCount:   parseInt(stats.count) || 0,
          totalRevenue: parseFloat(stats.revenue) || 0.0,
        };
      })
    );

    // Ordenar por el que más vendió
    return metrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
}
