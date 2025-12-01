/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('surveys', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned();
    table.integer('participant_id').unsigned();
    table.integer('satisfaction_score').checkBetween([1, 5]);
    table.integer('usefulness_score').checkBetween([1, 5]);
    table.integer('recommendation_score').checkBetween([1, 10]);
    table.text('what_liked');
    table.text('what_improve');
    table.text('additional_comments');
    table.boolean('would_attend_again').defaultTo(true);
    table.date('survey_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.foreign('event_id').references('id').inTable('events').onDelete('SET NULL');
    table.foreign('participant_id').references('id').inTable('participants').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('surveys');
};

