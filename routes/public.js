const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

// Home page - Landing page for donors and supporters
router.get('/', async (req, res) => {
  try {
    // Get some stats for the landing page
    const participantCount = await db('Participant').count('ParticipantID as count').first();
    const eventCount = await db('Event').count('EventID as count').first();
    const milestoneCount = await db('Milestone').count('MilestoneID as count').first();
    
    // Get upcoming events
    const upcomingEvents = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.*', 'EventDetails.EventName')
      .where('Event.EventDateTimeStart', '>=', new Date())
      .orderBy('Event.EventDateTimeStart', 'asc')
      .limit(3);
    
    res.render('public/home', {
      title: 'Ella Rises - Empowering Young Women in STEAM',
      stats: {
        participants: participantCount?.count || 0,
        events: eventCount?.count || 0,
        milestones: milestoneCount?.count || 0
      },
      upcomingEvents
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('public/home', {
      title: 'Ella Rises - Empowering Young Women in STEAM',
      stats: { participants: 0, events: 0, milestones: 0 },
      upcomingEvents: []
    });
  }
});

// About / Mission page
router.get('/mission', (req, res) => {
  res.render('public/mission', {
    title: 'Our Mission - Ella Rises'
  });
});

// Programs page
router.get('/programs', async (req, res) => {
  try {
    const events = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.*', 'EventDetails.*')
      .orderBy('Event.EventDateTimeStart', 'desc');
    
    res.render('public/programs', {
      title: 'Programs - Ella Rises',
      events
    });
  } catch (error) {
    console.error('Error loading programs:', error);
    res.render('public/programs', {
      title: 'Programs - Ella Rises',
      events: []
    });
  }
});

// Get Involved page
router.get('/get-involved', (req, res) => {
  res.render('public/get-involved', {
    title: 'Get Involved - Ella Rises'
  });
});

// Team page
router.get('/team', (req, res) => {
  res.render('public/team', {
    title: 'Our Team - Ella Rises'
  });
});

// Donate page
router.get('/donate', (req, res) => {
  res.render('public/donate', {
    title: 'Donate - Ella Rises'
  });
});

// Handle donation form submission
router.post('/donate', async (req, res) => {
  const bcrypt = require('bcrypt');
  const { 
    amount, first_name, last_name, email, 
    frequency, dedication, anonymous 
  } = req.body;

  // Validate required fields
  if (!amount || !first_name || !last_name || !email) {
    req.flash('error_msg', 'Please fill in all required fields');
    return res.redirect('/donate');
  }

  try {
    // Check if participant/donor already exists
    let participant = await db('Participant')
      .where('ParticipantEmail', email.toLowerCase())
      .first();

    let participantId;

    if (participant) {
      participantId = participant.ParticipantID;
    } else {
      // Create new participant/donor
      // Get the next ParticipantID
      const maxIdResult = await db('Participant').max('ParticipantID as maxId').first();
      const nextId = (maxIdResult.maxId || 0) + 1;
      participantId = nextId;

      // Generate random password for the new account
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      await db('Participant').insert({
        "ParticipantID": nextId,
        "ParticipantFirstName": first_name,
        "ParticipantLastName": last_name,
        "ParticipantEmail": email.toLowerCase(),
        "ParticipantRole": 'participant', // Default role
        "Password": hashedPassword
      });
    }

    // Create donation record
    await db('Donation').insert({
      "ParticipantID": participantId,
      "DonationAmount": parseFloat(amount),
      "DonationDate": new Date(),
      "TotalDonations": parseFloat(amount) // Following existing pattern
    });

    // Send thank you email (if we had a template for it)
    /*
    try {
      const donationData = { 
        name: `${first_name} ${last_name}`, 
        amount, 
        date: new Date().toLocaleDateString() 
      };
      // await sendEmail({...}); 
    } catch (emailError) {
      console.error('Error sending donation receipt:', emailError);
    }
    */

    req.flash('success_msg', 'Thank you for your donation! Your support makes a difference.');
    res.redirect('/donate');
  } catch (error) {
    console.error('Donation error:', error);
    req.flash('error_msg', 'An error occurred processing your donation. Please try again.');
    res.redirect('/donate');
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact Us - Ella Rises'
  });
});

// Teapot page - HTTP 418 Easter Egg
router.get('/teapot', (req, res) => {
  res.status(418).render('public/teapot', {
    title: "I'm a Teapot - Ella Rises"
  });
});

// Handle contact form submission
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !subject || !message) {
    req.flash('error_msg', 'Please fill in all fields');
    return res.redirect('/contact');
  }

  try {
    const contactData = { name, email, subject, message };

    // Send notification email to admin/organization
    const adminEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      const notificationTemplate = emailTemplates.contactNotification(contactData);
      await sendEmail({
        to: adminEmail,
        subject: notificationTemplate.subject,
        text: notificationTemplate.text,
        html: notificationTemplate.html
      });
    }

    // Send auto-reply to the person who submitted the form
    const autoReplyTemplate = emailTemplates.contactAutoReply(contactData);
    await sendEmail({
      to: email,
      subject: autoReplyTemplate.subject,
      text: autoReplyTemplate.text,
      html: autoReplyTemplate.html
    });

    req.flash('success_msg', 'Thank you for your message! We will get back to you soon.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    // Still show success to user even if email fails (form was received)
    req.flash('success_msg', 'Thank you for your message! We will get back to you soon.');
    res.redirect('/contact');
  }
});

module.exports = router;
