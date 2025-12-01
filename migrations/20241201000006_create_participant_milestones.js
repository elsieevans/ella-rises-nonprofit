/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('participant_milestones', (table) => {
    table.increments('id').primary();
    table.integer('participant_id').unsigned().notNullable();
    table.integer('milestone_id').unsigned().notNullable();
    table.date('achieved_date').notNullable();
    table.text('notes');
    table.integer('verified_by').unsigned();
    table.timestamps(true, true);
    
    table.foreign('participant_id').references('id').inTable('participants').onDelete('CASCADE');
    table.foreign('milestone_id').references('id').inTable('milestones').onDelete('CASCADE');
    table.foreign('verified_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('participant_milestones');
};

