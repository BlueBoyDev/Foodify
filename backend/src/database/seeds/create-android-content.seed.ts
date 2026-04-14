/**
 * RUTA: src/database/seeds/create-android-content.seed.ts
 *
 * Crea el contenido necesario para la App Android (Menú, Categorías e Inventario).
 * Ejecutar con:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/create-android-content.seed.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../../config/database.config';

async function main() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Obtener restaurante
    const restRows = await queryRunner.query(
      `SELECT id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1`,
    );
    if (!restRows.length) {
      throw new Error('❌ No se encontró el restaurante "demo-restaurant".');
    }
    const restaurantId: number = restRows[0].id;
    console.log(`✅ Restaurante demo encontrado (id: ${restaurantId})`);

    // 2. Asegurar que exista el Menú con ID = 1 asociado al restaurante
    const menuRows = await queryRunner.query(`SELECT id FROM menus WHERE id = 1`);
    if (!menuRows.length) {
      await queryRunner.query(
        `INSERT INTO menus (id, restaurant_id, name, description, is_active) 
         VALUES (1, ?, 'Menú Principal', 'Menú por defecto para Android', 1)`,
        [restaurantId]
      );
      console.log(`✅ Menú Principal creado (id = 1)`);
    } else {
      // Si existe, nos aseguramos de que pertenezca al demo-restaurant
      await queryRunner.query(
        `UPDATE menus SET restaurant_id = ? WHERE id = 1`,
        [restaurantId]
      );
      console.log(`✅ Menú con id=1 actualizado para pertenecer al restaurante demo`);
    }

    // 3. Crear o actualizar Categories (tabla menu_categories)
    const catsAndDishes = [
      { name: 'Entradas', desc: 'Para comenzar', is_active: 1 },
      { name: 'Platos Fuertes', desc: 'Nuestras especialidades', is_active: 1 },
      { name: 'Bebidas', desc: 'Refrescantes', is_active: 1 },
    ];

    let sortOrder = 1;
    for (const c of catsAndDishes) {
      const existingParams = await queryRunner.query(
        `SELECT id FROM menu_categories WHERE name = ? AND menu_id = 1`, [c.name]
      );
      if (!existingParams.length) {
        await queryRunner.query(
          `INSERT INTO menu_categories (menu_id, name, description, is_active, sort_order) 
           VALUES (1, ?, ?, ?, ?)`,
          [c.name, c.desc, c.is_active, sortOrder]
        );
      }
      sortOrder++;
    }
    console.log(`✅ Categorías vinculadas al menu_id=1 creadas`);

    // 4. Insumos de Inventario (inventory_items)
    const inventoryItems = [
      { name: 'Tomate', unit: 'kg', min: 5 },
      { name: 'Carne', unit: 'kg', min: 10 },
      { name: 'Pan', unit: 'piezas', min: 50 },
      { name: 'Lechuga', unit: 'kg', min: 3 },
      { name: 'Sal', unit: 'kg', min: 1 },
    ];

    for (const item of inventoryItems) {
      const existingAttr = await queryRunner.query(
        `SELECT id FROM inventory_items WHERE name = ? AND restaurant_id = ?`,
        [item.name, restaurantId]
      );
      if (!existingAttr.length) {
        await queryRunner.query(
          `INSERT INTO inventory_items (restaurant_id, name, unit, min_stock) 
           VALUES (?, ?, ?, ?)`,
          [restaurantId, item.name, item.unit, item.min]
        );
      }
    }
    console.log(`✅ ${inventoryItems.length} insumos de inventario básicos creados.`);

    await queryRunner.commitTransaction();
    console.log('\n🎉 ¡Contenido para la App Android creado con éxito!\n');
  } catch (err: any) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error ejecutando seed de contenido:', err.message);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

main();
