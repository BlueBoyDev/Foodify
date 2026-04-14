// RUTA: src/modules/dishes/dishes.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { CreateDishDto, UpdateDishDto } from './dto/dish.dto';

@Injectable()
export class DishesService {
  constructor(@InjectRepository(Dish) private repo: Repository<Dish>) {}

  findAll(
    restaurantId: number,
    filters: { categoryId?: number; available?: boolean; search?: string; menuId?: number },
    role: string = 'restaurant_admin',
  ) {
    const qb = this.repo.createQueryBuilder('d')
      .leftJoinAndSelect('d.category','cat')
      // En strings de QueryBuilder usamos nombres reales de columnas SQL.
      .where('d.restaurant_id = :rid AND d.deleted_at IS NULL', { rid: restaurantId });

    // Roles no-admin solo ven platillos disponibles (waiter, chef, cashier)
    if (role !== 'restaurant_admin') {
      qb.andWhere('d.is_available = :avail', { avail: true });
    } else if (filters.available !== undefined) {
      qb.andWhere('d.is_available = :a', { a: filters.available });
    }

    if (filters.categoryId) qb.andWhere('d.category_id = :cid', { cid: filters.categoryId });
    if (filters.search) qb.andWhere('d.name LIKE :s', { s: `%${filters.search}%` });
    return qb.orderBy('d.sort_order','ASC').getMany();
  }

  async findOne(id: number, restaurantId: number) {
    const d = await this.repo.findOne({
      where: { id, restaurant: { id: restaurantId }, deletedAt: IsNull() },
      relations: ['category'],
    });
    if (!d) throw new NotFoundException('Platillo no encontrado');
    return d;
  }

  async create(restaurantId: number, dto: CreateDishDto) {
    try {
      // Mapeo manual para asegurar compatibilidad con camelCase y snake_case
      const { 
        cost_est, costEst, 
        prep_time_min, prepTimeMin, 
        category_id, categoryId, 
        sort_order, sortOrder, 
        is_available, isAvailable,
        ...rest 
      } = dto as any;

      const dish = this.repo.create({
        ...rest,
        restaurant: { id: restaurantId } as any
      }) as any;

      if (cost_est !== undefined || costEst !== undefined) {
        dish.costEst = cost_est !== undefined ? cost_est : costEst;
      }
      if (prep_time_min !== undefined || prepTimeMin !== undefined) {
        dish.prepTimeMin = prep_time_min !== undefined ? prep_time_min : prepTimeMin;
      }
      if (category_id !== undefined || categoryId !== undefined) {
        const catId = category_id !== undefined ? category_id : categoryId;
        dish.category = catId ? { id: catId } as any : null;
      }
      if (sort_order !== undefined || sortOrder !== undefined) {
        dish.sortOrder = sort_order !== undefined ? sort_order : sortOrder;
      }
      if (is_available !== undefined || isAvailable !== undefined) {
        dish.isAvailable = is_available !== undefined ? is_available : isAvailable;
      }

      return await this.repo.save(dish);
    } catch (error) {
       console.error('[DEBUG] Error creating dish:', error);
       throw new InternalServerErrorException(`[DEBUG] Dish Create Error: ${error.message}`);
    }
  }

  async update(id: number, restaurantId: number, dto: UpdateDishDto) {
    try {
      const dish = await this.findOne(id, restaurantId);

      // Mapeo manual para asegurar compatibilidad con camelCase y snake_case
      const { 
        cost_est, costEst, 
        prep_time_min, prepTimeMin, 
        category_id, categoryId, 
        sort_order, sortOrder, 
        is_available, isAvailable,
        ...rest 
      } = dto as any;

      Object.assign(dish, rest);

      if (cost_est !== undefined || costEst !== undefined) {
        dish.costEst = cost_est !== undefined ? cost_est : costEst;
      }
      if (prep_time_min !== undefined || prepTimeMin !== undefined) {
        dish.prepTimeMin = prep_time_min !== undefined ? prep_time_min : prepTimeMin;
      }
      if (category_id !== undefined || categoryId !== undefined) {
        const catId = category_id !== undefined ? category_id : categoryId;
        dish.category = catId ? { id: catId } as any : null;
      }
      if (sort_order !== undefined || sortOrder !== undefined) {
        dish.sortOrder = sort_order !== undefined ? sort_order : sortOrder;
      }
      if (is_available !== undefined || isAvailable !== undefined) {
        dish.isAvailable = is_available !== undefined ? is_available : isAvailable;
      }

      return await this.repo.save(dish);
    } catch (error) {
       console.error('[DEBUG] Error updating dish:', error);
       throw new InternalServerErrorException(`[DEBUG] Dish Update Error: ${error.message}`);
    }
  }

  async toggleAvailability(id: number, restaurantId: number) {
    const dish = await this.findOne(id, restaurantId);
    await this.repo
      .createQueryBuilder()
      .update(Dish)
      .set({ isAvailable: !dish.isAvailable })
      .where('id = :id AND restaurant_id = :rid', { id, rid: restaurantId })
      .execute();
    return this.findOne(id, restaurantId);
  }

  async remove(id: number, restaurantId: number) {
    await this.repo
      .createQueryBuilder()
      .update(Dish)
      .set({ deletedAt: new Date() })
      .where('id = :id AND restaurant_id = :rid', { id, rid: restaurantId })
      .execute();
    return { message: 'Platillo eliminado' };
  }

  async uploadImages(id: number, restaurantId: number, files: Express.Multer.File[]) {
    // TODO: subir a S3 y guardar URLs (máx 3)
    const urls = files.slice(0,3).map((_,i) => `https://s3.amazonaws.com/foodify-assets/${id}-img${i}.jpg`);
    await this.repo
      .createQueryBuilder()
      .update(Dish)
      .set({ images: urls })
      .where('id = :id AND restaurant_id = :rid', { id, rid: restaurantId })
      .execute();
    return { images: urls };
  }
}

