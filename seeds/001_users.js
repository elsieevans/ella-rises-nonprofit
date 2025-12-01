const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await knex('users').insert([
    {
      email: 'manager@ellarises.org',
      password: hashedPassword,
      first_name: 'Maria',
      last_name: 'Garcia',
      role: 'manager',
      is_active: true
    },
    {
      email: 'user@ellarises.org',
      password: hashedPassword,
      first_name: 'Sarah',
      last_name: 'Johnson',
      role: 'user',
      is_active: true
    },
    {
      email: 'volunteer@ellarises.org',
      password: hashedPassword,
      first_name: 'Emily',
      last_name: 'Chen',
      role: 'user',
      is_active: true
    }
  ]);
};

