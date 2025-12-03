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
    const user = await db('Participant')
      .where('ParticipantEmail', email.toLowerCase())
      .first();

    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Check password
    let isMatch = await bcrypt.compare(password, user.Password);
    
    // Fallback: If bcrypt check fails, check if the password is stored as plain text
    // This handles legacy data or initial seeds that weren't hashed
    if (!isMatch && password === user.Password) {
      isMatch = true;
      
      // Upgrade the password to a hash for security
      try {
        const newHash = await bcrypt.hash(password, 10);
        await db('Participant')
          .where('ParticipantID', user.ParticipantID)
          .update({ Password: newHash });
      } catch (err) {
        console.error('Failed to upgrade password hash:', err);
      }
    }
    
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Map role: admin -> Admin, participant -> user/viewer
    const role = user.ParticipantRole === 'admin' ? 'Admin' : 'user';

    // Set session
    req.session.user = {
      id: user.ParticipantID,
      email: user.ParticipantEmail,
      first_name: user.ParticipantFirstName,
      last_name: user.ParticipantLastName,
      role: role
    };
    
    // Save session before redirect (important for production)
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        req.flash('error_msg', 'Login failed. Please try again.');
        return res.redirect('/auth/login');
      }
      req.flash('success_msg', `Welcome back, ${user.ParticipantFirstName}!`);
      res.redirect('/portal/dashboard');
    });
    
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
    const existingUser = await db('Participant').where('ParticipantEmail', email.toLowerCase()).first();
    
    if (existingUser) {
      req.flash('error_msg', 'An account with this email already exists');
      return res.redirect('/auth/register');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (default role is 'participant')
    await db('Participant').insert({
      "ParticipantFirstName": first_name,
      "ParticipantLastName": last_name,
      "ParticipantEmail": email.toLowerCase(),
      "Password": hashedPassword,
      "ParticipantRole": 'participant'
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
