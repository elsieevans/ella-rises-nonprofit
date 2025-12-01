/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('event_participants', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().notNullable();
    table.integer('participant_id').unsigned().notNullable();
    table.enum('status', ['registered', 'attended', 'no-show', 'cancelled']).defaultTo('registered');
    table.timestamp('registered_at').defaultTo(knex.fn.now());
    table.timestamp('attended_at');
    table.text('notes');
    
    table.foreign('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.foreign('participant_id').references('id').inTable('participants').onDelete('CASCADE');
    table.unique(['event_id', 'participant_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('event_participants');
};

