const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';

console.log('======================================');
console.log('DATABASE CONFIGURATION DEBUG');
console.log('======================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Detected Environment:', environment);
console.log('--------------------------------------');
console.log('Environment Variables:');
console.log('RDS_HOSTNAME:', process.env.RDS_HOSTNAME);
console.log('RDS_PORT:', process.env.RDS_PORT);
console.log('RDS_DB_NAME:', process.env.RDS_DB_NAME);
console.log('RDS_USERNAME:', process.env.RDS_USERNAME);
console.log('RDS_PASSWORD:', process.env.RDS_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);
console.log('--------------------------------------');
console.log('Knex Configuration for', environment + ':');
const config = knexConfig[environment];
console.log('Client:', config.client);
console.log('Connection Host:', config.connection.host);
console.log('Connection Port:', config.connection.port);
console.log('Connection Database:', config.connection.database);
console.log('Connection User:', config.connection.user);
console.log('Connection Password:', config.connection.password ? '***SET***' : 'NOT SET');
console.log('Connection SSL:', config.connection.ssl);
console.log('======================================');

const db = knex(knexConfig[environment]);

module.exports = db;
