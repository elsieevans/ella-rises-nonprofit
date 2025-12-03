const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Analytics dashboard - accessible by all authenticated users
router.get('/', isAuthenticated, (req, res) => {
  res.render('portal/analytics/index', {
    title: 'Analytics Dashboard - Ella Rises',
    currentPage: 'analytics',
    pageTitle: 'Analytics Dashboard'
  });
});

module.exports = router;

