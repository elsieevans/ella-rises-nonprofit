require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const flash = require('connect-flash');
const helmet = require('helmet');
const path = require('path');
const db = require('./config/database');

const app = express();

// Create a direct pg Pool for sessions
const sessionPool = new Pool({
  host: process.env.RDS_HOSTNAME || process.env.DB_HOST || 'localhost',
  port: process.env.RDS_PORT || process.env.DB_PORT || 5432,
  database: process.env.RDS_DB_NAME || process.env.DB_NAME || 'ella_rises',
  user: process.env.RDS_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

sessionPool.on('error', (err) => {
  console.error('Session pool error:', err);
});

// Trust proxy - required for HTTPS behind AWS Load Balancer
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null
    }
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration with PostgreSQL store
const sessionStore = new pgSession({
  pool: sessionPool,
  tableName: 'session',
  createTableIfMissing: true
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'ella-rises-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    // secure: false works because NGINX handles HTTPS termination
    // Traffic is still encrypted between users and AWS
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const portalRoutes = require('./routes/portal');
const participantRoutes = require('./routes/participants');
const eventRoutes = require('./routes/events');
const surveyRoutes = require('./routes/surveys');
const milestoneRoutes = require('./routes/milestones');
const donationRoutes = require('./routes/donations');
const dashboardRoutes = require('./routes/dashboard');

app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/portal', portalRoutes);
app.use('/portal/participants', participantRoutes);
app.use('/portal/events', eventRoutes);
app.use('/portal/surveys', surveyRoutes);
app.use('/portal/milestones', milestoneRoutes);
app.use('/portal/donations', donationRoutes);
app.use('/portal/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (typeof res.locals.user === 'undefined') {
    res.locals.user = null;
  }
  res.status(500).render('errors/500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('Database migrations skipped (manual management).');
  } catch (err) {
    console.error('Startup error:', err);
  }

  app.listen(PORT, () => {
    console.log(`Ella Rises server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
