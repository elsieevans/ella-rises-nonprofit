// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Check if user is an Admin
const isManager = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'Admin') {
    return next();
  }
  req.flash('error_msg', 'You do not have permission to perform this action');
  res.redirect('/portal/dashboard');
};

// Check if user is authenticated (for API routes)
const isAuthenticatedAPI = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Check if user is Admin (for API routes)
const isManagerAPI = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'Admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden - Admin access required' });
};

module.exports = {
  isAuthenticated,
  isManager,
  isAuthenticatedAPI,
  isManagerAPI
};
