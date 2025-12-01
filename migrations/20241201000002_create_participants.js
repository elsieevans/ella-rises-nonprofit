/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('participants', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20);
    table.date('date_of_birth');
    table.string('school', 255);
    table.string('grade_level', 50);
    table.string('parent_guardian_name', 200);
    table.string('parent_guardian_email', 255);
    table.string('parent_guardian_phone', 20);
    table.text('interests');
    table.text('notes');
    table.boolean('is_active').defaultTo(true);
    table.date('enrollment_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('participants');
};

