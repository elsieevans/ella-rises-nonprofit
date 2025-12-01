const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Portal home - redirect to dashboard
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/portal/dashboard');
});

module.exports = router;

