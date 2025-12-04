const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// Portal home - redirect to dashboard
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/portal/dashboard');
});

// Debug Schema Route
router.get('/debug-schema', isAuthenticated, async (req, res) => {
  try {
    const db = require('../config/database');
    const tables = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    
    const schema = {};
    for (const row of tables.rows) {
      const tableName = row.table_name;
      const columns = await db.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`);
      schema[tableName] = columns.rows;
    }
    
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fix Database Schema Route
router.get('/fix-db-schema', isAuthenticated, isManager, async (req, res) => {
  try {
    const results = [];

    // 1. Check and Add RegistrationCheckInTime
    try {
      const checkInTimeExists = await db.schema.hasColumn('Registration', 'RegistrationCheckInTime');
      if (!checkInTimeExists) {
        await db.schema.table('Registration', table => {
          table.timestamp('RegistrationCheckInTime').nullable();
        });
        results.push('Added column: RegistrationCheckInTime');
      } else {
        results.push('Column already exists: RegistrationCheckInTime');
      }
    } catch (err) {
      results.push('Error checking/adding RegistrationCheckInTime: ' + err.message);
    }

    // 2. Check and Add RegistrationAttendedFlag
    try {
      const attendedFlagExists = await db.schema.hasColumn('Registration', 'RegistrationAttendedFlag');
      if (!attendedFlagExists) {
        await db.schema.table('Registration', table => {
          table.integer('RegistrationAttendedFlag').defaultTo(0);
        });
        results.push('Added column: RegistrationAttendedFlag');
      } else {
        results.push('Column already exists: RegistrationAttendedFlag');
      }
    } catch (err) {
      results.push('Error checking/adding RegistrationAttendedFlag: ' + err.message);
    }

    res.render('portal/dashboard', {
        title: 'DB Fix Results',
        user: req.session.user,
        stats: {}, // Dummy stats to prevent view error
        events: [],
        success_msg: 'Database Fix Attempted:\n' + results.join('\n')
    });
    
  } catch (error) {
    console.error('DB Fix Error:', error);
    res.status(500).send('Fatal Error during DB fix: ' + error.message);
  }
});

module.exports = router;

