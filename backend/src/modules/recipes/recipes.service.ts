// RUTA: src/modules/recipes/recipes.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe }            from './entities/recipe.entity';
import { RecipeIngredient }  from './entities/recipe-ingredient.entity';
import { InventoryItem }     from '../inventory/entities/inventory-item.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)           private recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient) private ingRepo:    Repository<RecipeIngredient>,
  ) {}

  async findByDish(dishId: number) {
    return this.recipeRepo.findOne({ where: { dishId }, relations: ['ingredients','ingredients.item'] });
  }

  async upsert(dishId: number, dto: any) {
    try {
      const { ingredients, ...recipeData } = dto;
      
      // Limpiamos campos que podrían causar conflictos de integridad
      delete (recipeData as any).dishId;
      delete (recipeData as any).dish_id;

      let recipe = await this.recipeRepo.findOneBy({ dishId });

      if (recipe) {
        Object.assign(recipe, recipeData);
        await this.recipeRepo.save(recipe);
        await this.ingRepo.delete({ recipeId: recipe.id });
      } else {
        const newRecipe = this.recipeRepo.create({ ...recipeData, dishId } as any);
        recipe = await this.recipeRepo.save(newRecipe) as any;
      }

      if (ingredients?.length) {
        // Validación de seguridad: Verificar que todos los items existan
        for (const ing of ingredients) {
          if (ing.itemId) {
            const item = await this.ingRepo.manager.getRepository(InventoryItem).findOneBy({ id: ing.itemId });
            if (!item) {
              throw new Error(`El insumo con ID ${ing.itemId} (${ing.name}) no se encuentra en el inventario. Por favor, créalo primero.`);
            }
          }
        }

        const ings = ingredients.map((i: any) => {
          const cleanIng = { ...i, recipeId: recipe.id };
          // Forzamos tipos numéricos y limpiamos posibles duplicados de naming
          if (cleanIng.itemId) cleanIng.itemId = Number(cleanIng.itemId);
          if (cleanIng.quantity) cleanIng.quantity = Number(cleanIng.quantity);
          delete (cleanIng as any).item_id;
          return this.ingRepo.create(cleanIng);
        });
        await this.ingRepo.save(ings);
      }
      return this.findByDish(dishId);
    } catch (error) {
       console.error('[DEBUG] Error upserting recipe:', error);
       throw new InternalServerErrorException(`[DEBUG] Recipe Upsert Error: ${error.message} - Dish: ${dishId}`);
    }
  }

  async addIngredient(dishId: number, dto: any) {
    const recipe = await this.recipeRepo.findOneBy({ dishId });
    if (!recipe) throw new NotFoundException('Receta no encontrada');
    return this.ingRepo.save(this.ingRepo.create({ ...dto, recipeId: recipe.id }));
  }

  async updateIngredient(ingId: number, dto: any) {
    await this.ingRepo.update(ingId, dto);
    return this.ingRepo.findOneBy({ id: ingId });
  }

  removeIngredient(ingId: number) { return this.ingRepo.delete(ingId); }
}
