const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/portal/dashboard');
  }
  res.render('auth/login', {
    title: 'Login - Ella Rises'
  });
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await db('users')
      .where({ email: email.toLowerCase(), is_active: true })
      .first();
    
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };
    
    req.flash('success_msg', `Welcome back, ${user.first_name}!`);
    res.redirect('/portal/dashboard');
    
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'An error occurred during login. Please try again.');
    res.redirect('/auth/login');
  }
});

// Register page (for managers to create new users)
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/portal/dashboard');
  }
  res.render('auth/register', {
    title: 'Register - Ella Rises'
  });
});

// Handle registration
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, confirm_password } = req.body;
  
  // Validation
  const errors = [];
  
  if (!first_name || !last_name || !email || !password) {
    errors.push('Please fill in all fields');
  }
  
  if (password !== confirm_password) {
    errors.push('Passwords do not match');
  }
  
  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register - Ella Rises',
      errors,
      first_name,
      last_name,
      email
    });
  }
  
  try {
    // Check if user exists
    const existingUser = await db('users').where({ email: email.toLowerCase() }).first();
    
    if (existingUser) {
      req.flash('error_msg', 'An account with this email already exists');
      return res.redirect('/auth/register');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (default role is 'user')
    await db('users').insert({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      is_active: true
    });
    
    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
    
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'An error occurred during registration. Please try again.');
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;

