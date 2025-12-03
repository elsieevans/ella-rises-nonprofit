const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all participants
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, school } = req.query;
    
    let query = db('Participant').orderBy('ParticipantLastName', 'asc');
    
    if (search) {
      query = query.where(function() {
        this.where('ParticipantFirstName', 'ilike', `%${search}%`)
          .orWhere('ParticipantLastName', 'ilike', `%${search}%`)
          .orWhere('ParticipantEmail', 'ilike', `%${search}%`);
      });
    }
    
    if (school) {
      query = query.where('ParticipantSchool', 'ilike', `%${school}%`);
    }
    
    // Status filter removed as is_active column is missing
    
    const participants = await query;
    
    // Get unique schools for filter
    const schools = await db('Participant')
      .distinct('ParticipantSchool')
      .whereNotNull('ParticipantSchool')
      .orderBy('ParticipantSchool');
    
    res.render('portal/participants/index', {
      title: 'Participants - Ella Rises Portal',
      participants,
      schools: schools.map(s => s.ParticipantSchool),
      filters: { search, school }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    req.flash('error_msg', 'Error loading participants');
    res.redirect('/portal/dashboard');
  }
});

// New participant form
router.get('/new', isAuthenticated, isManager, (req, res) => {
  res.render('portal/participants/form', {
    title: 'Add Participant - Ella Rises Portal',
    participant: {},
    isEdit: false
  });
});

// Create participant
router.post('/', isAuthenticated, isManager, async (req, res) => {
  const bcrypt = require('bcrypt');
  
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      school, employer, field_of_interest, 
      city, state, zip, role, password
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email) {
      req.flash('error_msg', 'First Name, Last Name, and Email are required');
      return res.redirect('/portal/participants/new');
    }

    // Check if email already exists
    const existingParticipant = await db('Participant')
      .where('ParticipantEmail', email.toLowerCase())
      .first();
    
    if (existingParticipant) {
      req.flash('error_msg', 'A participant with this email already exists');
      return res.redirect('/portal/participants/new');
    }

    // Get the next ParticipantID (max + 1)
    const maxIdResult = await db('Participant').max('ParticipantID as maxId').first();
    const nextId = (maxIdResult.maxId || 0) + 1;

    // Hash password if provided, otherwise generate a random one
    const passwordToUse = password || Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    await db('Participant').insert({
      "ParticipantID": nextId,
      "ParticipantFirstName": first_name,
      "ParticipantLastName": last_name,
      "ParticipantEmail": email.toLowerCase(),
      "ParticipantPhone": phone,
      "ParticipantDOB": date_of_birth || null,
      "ParticipantSchool": school,
      "ParticipantEmployer": employer,
      "ParticipantFieldOfInterest": field_of_interest,
      "ParticipantCity": city,
      "ParticipantState": state,
      "ParticipantZip": zip,
      "ParticipantRole": role || 'participant',
      "Password": hashedPassword
    });
    
    req.flash('success_msg', 'Participant added successfully');
    res.redirect('/portal/participants');
  } catch (error) {
    console.error('Error creating participant:', error);
    req.flash('error_msg', 'Error adding participant: ' + error.message);
    res.redirect('/portal/participants/new');
  }
});

// View participant details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const participant = await db('Participant').where('ParticipantID', req.params.id).first();
    
    if (!participant) {
      req.flash('error_msg', 'Participant not found');
      return res.redirect('/portal/participants');
    }
    
    // Get participant's milestones (direct from Milestone table)
    const milestones = await db('Milestone')
      .where('ParticipantID', req.params.id)
      .orderBy('MilestoneDate', 'desc');
    
    // Get participant's event history
    // Join Registration -> Event -> EventDetails
    const events = await db('Registration')
      .join('Event', 'Registration.EventID', 'Event.EventID')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .where('Registration.ParticipantID', req.params.id)
      .select(
        'EventDetails.EventName',
        'Event.EventDateTimeStart',
        'Registration.RegistrationStatus',
        'Registration.RegistrationCheckInTime'
      )
      .orderBy('Event.EventDateTimeStart', 'desc');
    
    // Available milestones logic removed as there's no definition table
    
    res.render('portal/participants/view', {
      title: `${participant.ParticipantFirstName} ${participant.ParticipantLastName} - Ella Rises Portal`,
      participant,
      milestones,
      events,
      availableMilestones: [] // Empty array to prevent view error
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    req.flash('error_msg', 'Error loading participant details');
    res.redirect('/portal/participants');
  }
});

// Edit participant form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const participant = await db('Participant').where('ParticipantID', req.params.id).first();
    
    if (!participant) {
      req.flash('error_msg', 'Participant not found');
      return res.redirect('/portal/participants');
    }
    
    res.render('portal/participants/form', {
      title: 'Edit Participant - Ella Rises Portal',
      participant,
      isEdit: true
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    req.flash('error_msg', 'Error loading participant');
    res.redirect('/portal/participants');
  }
});

// Update participant
router.post('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      school, employer, field_of_interest, 
      city, state, zip, role
    } = req.body;
    
    await db('Participant').where('ParticipantID', req.params.id).update({
      "ParticipantFirstName": first_name,
      "ParticipantLastName": last_name,
      "ParticipantEmail": email,
      "ParticipantPhone": phone,
      "ParticipantDOB": date_of_birth || null,
      "ParticipantSchool": school,
      "ParticipantEmployer": employer,
      "ParticipantFieldOfInterest": field_of_interest,
      "ParticipantCity": city,
      "ParticipantState": state,
      "ParticipantZip": zip,
      "ParticipantRole": role
    });
    
    req.flash('success_msg', 'Participant updated successfully');
    res.redirect(`/portal/participants/${req.params.id}`);
  } catch (error) {
    console.error('Error updating participant:', error);
    req.flash('error_msg', 'Error updating participant');
    res.redirect(`/portal/participants/${req.params.id}/edit`);
  }
});

// Delete participant
router.post('/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('Participant').where('ParticipantID', req.params.id).del();
    req.flash('success_msg', 'Participant deleted successfully');
    res.redirect('/portal/participants');
  } catch (error) {
    console.error('Error deleting participant:', error);
    req.flash('error_msg', 'Error deleting participant');
    res.redirect('/portal/participants');
  }
});

// Assign milestone (Create new Milestone record)
router.post('/:id/milestones', isAuthenticated, isManager, async (req, res) => {
  try {
    const { title, date, notes } = req.body; // title and date from form
    
    await db('Milestone').insert({
      "ParticipantID": req.params.id,
      "MilestoneTitle": title,
      "MilestoneDate": date || new Date(),
      // MilestoneNo could be auto-incremented or passed if needed
    });
    
    req.flash('success_msg', 'Milestone added successfully');
    res.redirect(`/portal/participants/${req.params.id}`);
  } catch (error) {
    console.error('Error adding milestone:', error);
    req.flash('error_msg', 'Error adding milestone');
    res.redirect(`/portal/participants/${req.params.id}`);
  }
});

// Remove milestone
router.post('/:id/milestones/:mid/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('Milestone').where('MilestoneID', req.params.mid).del();
    req.flash('success_msg', 'Milestone removed successfully');
    res.redirect(`/portal/participants/${req.params.id}`);
  } catch (error) {
    console.error('Error removing milestone:', error);
    req.flash('error_msg', 'Error removing milestone');
    res.redirect(`/portal/participants/${req.params.id}`);
  }
});

module.exports = router;
