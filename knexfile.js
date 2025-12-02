require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ella_rises',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.RDS_HOSTNAME,
      port: process.env.RDS_PORT,
      database: process.env.RDS_DB_NAME || process.env.DB_NAME,
      user: process.env.RDS_USERNAME || process.env.DB_USER,
      password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};

