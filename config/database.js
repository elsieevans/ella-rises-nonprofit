const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';

if (environment === 'production') {
  console.log('--- DATABASE CONNECTION DEBUG ---');
  console.log('Environment:', environment);
  console.log('RDS_HOSTNAME:', process.env.RDS_HOSTNAME);
  console.log('RDS_DB_NAME:', process.env.RDS_DB_NAME);
  console.log('RDS_USERNAME:', process.env.RDS_USERNAME);
  // Do not log password
  console.log('---------------------------------');
}

const db = knex(knexConfig[environment]);

module.exports = db;
