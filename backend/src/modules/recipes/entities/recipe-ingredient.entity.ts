// RUTA: src/modules/recipes/entities/recipe-ingredient.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Recipe }        from './recipe.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryGeneratedColumn({ unsigned: true }) id: number;
  @ManyToOne(() => Recipe, r => r.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
  @Column({ name: 'recipe_id', unsigned: true }) recipeId: number;
  /** FK opcional a inventory_items — vincula con FIFO */
  @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem | null;
  @Column({ name: 'item_id', unsigned: true, nullable: true }) itemId: number | null;
  @Column({ length: 100 }) name: string;
  @Column({ type: 'decimal', precision: 10, scale: 4 }) quantity: number;
  @Column({ length: 20 }) unit: string;
  @Column({ name: 'is_optional', default: false }) isOptional: boolean;
}
