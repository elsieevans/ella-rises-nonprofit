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
  
  console.log('Login attempt for:', email);

  try {
    // Find user by email
    const user = await db('Participant')
      .where('ParticipantEmail', email.toLowerCase())
      .first();
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
        console.log('User details (partial):', { 
            id: user.ParticipantID, 
            email: user.ParticipantEmail, 
            hasPassword: !!user.Password 
        });
    }

    if (!user) {
      console.log('Login failed: User not found');
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Check password (assuming ParticipantPassword column exists)
    // If using a different auth mechanism, this needs to be adjusted
    let isMatch = await bcrypt.compare(password, user.Password);
    
    // Fallback: If bcrypt check fails, check if the password is stored as plain text
    // This handles legacy data or initial seeds that weren't hashed
    if (!isMatch && password === user.Password) {
      console.log('Plain text password match found. Converting to hash...');
      isMatch = true;
      
      // Optional: Upgrade the password to a hash for security
      try {
        const newHash = await bcrypt.hash(password, 10);
        await db('Participant')
          .where('ParticipantID', user.ParticipantID)
          .update({ Password: newHash });
        console.log('Password automatically upgraded to bcrypt hash.');
      } catch (err) {
        console.error('Failed to upgrade password hash:', err);
      }
    }

    console.log('Password match final result:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Password incorrect');
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Map role: admin -> Admin, participant -> user/viewer
    const role = user.ParticipantRole === 'admin' ? 'Admin' : 'user';
    console.log('User role:', role);

    // Set session
    req.session.user = {
      id: user.ParticipantID,
      email: user.ParticipantEmail,
      first_name: user.ParticipantFirstName,
      last_name: user.ParticipantLastName,
      role: role
    };
    
    console.log('Session set for user:', req.session.user.email);
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
    const existingUser = await db('Participant').where('ParticipantEmail', email.toLowerCase()).first();
    
    if (existingUser) {
      req.flash('error_msg', 'An account with this email already exists');
      return res.redirect('/auth/register');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (default role is 'participant')
    // Note: Assuming ParticipantPassword column exists
    await db('Participant').insert({
      "ParticipantFirstName": first_name,
      "ParticipantLastName": last_name,
      "ParticipantEmail": email.toLowerCase(),
      "Password": hashedPassword,
      "ParticipantRole": 'participant'
      // Removing is_active as it's not in the new schema
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

