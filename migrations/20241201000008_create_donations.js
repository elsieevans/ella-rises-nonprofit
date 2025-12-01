/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('donations', (table) => {
    table.increments('id').primary();
    table.string('donor_name', 200).notNullable();
    table.string('donor_email', 255);
    table.string('donor_phone', 20);
    table.decimal('amount', 10, 2).notNullable();
    table.enum('donation_type', ['one-time', 'monthly', 'annual', 'in-kind']).defaultTo('one-time');
    table.enum('payment_method', ['credit_card', 'check', 'cash', 'bank_transfer', 'other']).defaultTo('credit_card');
    table.date('donation_date').notNullable();
    table.string('campaign', 255);
    table.boolean('is_anonymous').defaultTo(false);
    table.boolean('receipt_sent').defaultTo(false);
    table.boolean('thank_you_sent').defaultTo(false);
    table.text('notes');
    table.string('transaction_id', 255);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('donations');
};

