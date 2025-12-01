/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.enum('event_type', ['workshop', 'mentoring', 'leadership', 'steam', 'arts', 'community', 'other']).defaultTo('workshop');
    table.date('event_date').notNullable();
    table.time('start_time');
    table.time('end_time');
    table.string('location', 255);
    table.string('venue_name', 255);
    table.integer('max_participants');
    table.integer('current_participants').defaultTo(0);
    table.string('instructor', 200);
    table.string('partner_organization', 255);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_recurring').defaultTo(false);
    table.text('notes');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('events');
};

