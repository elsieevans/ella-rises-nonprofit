const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all participants
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, school } = req.query;
    
    // Base query with LEFT JOINs to get school and employer names
    let query = db('Participant')
      .leftJoin('ParticipantSchool', 'Participant.ParticipantID', 'ParticipantSchool.ParticipantID')
      .leftJoin('School', 'ParticipantSchool.SchoolID', 'School.SchoolID')
      .leftJoin('ParticipantEmployer', 'Participant.ParticipantID', 'ParticipantEmployer.ParticipantID')
      .leftJoin('Employer', 'ParticipantEmployer.EmployerID', 'Employer.EmployerID')
      .select(
        'Participant.*',
        'School.SchoolName',
        'Employer.EmployerName'
      )
      .orderBy('Participant.ParticipantLastName', 'asc');
    
    if (search) {
      query = query.where(function() {
        this.where('Participant.ParticipantFirstName', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantLastName', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantEmail', 'ilike', `%${search}%`);
      });
    }
    
    if (school) {
      query = query.where('School.SchoolName', 'ilike', `%${school}%`);
    }
    
    const participants = await query;
    
    // Get unique schools for filter dropdown (from School table)
    const schools = await db('School')
      .distinct('SchoolName')
      .whereNotNull('SchoolName')
      .orderBy('SchoolName');
    
    res.render('portal/participants/index', {
      title: 'Participants - Ella Rises Portal',
      participants,
      schools: schools.map(s => s.SchoolName),
      filters: { search, school }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    req.flash('error_msg', 'Error loading participants');
    res.redirect('/portal/dashboard');
  }
});

// New participant form
router.get('/new', isAuthenticated, isManager, async (req, res) => {
  try {
    // Get all schools and employers for dropdowns
    const schools = await db('School').orderBy('SchoolName');
    const employers = await db('Employer').orderBy('EmployerName');
    
    res.render('portal/participants/form', {
      title: 'Add Participant - Ella Rises Portal',
      participant: {},
      schools,
      employers,
      isEdit: false
    });
  } catch (error) {
    console.error('Error loading form:', error);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/portal/participants');
  }
});

// Create participant
router.post('/', isAuthenticated, isManager, async (req, res) => {
  const bcrypt = require('bcrypt');
  
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      school_id, new_school, employer_id, new_employer, field_of_interest, 
      city, state, zip, role, password
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !date_of_birth || !city || !state || !zip || !field_of_interest) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/portal/participants/new');
    }
    
    // Validate school or employer
    if (!school_id && !new_school) {
      req.flash('error_msg', 'School is required (select existing or enter new)');
      return res.redirect('/portal/participants/new');
    }
    
    if (!employer_id && !new_employer) {
      req.flash('error_msg', 'Employer is required (select existing or enter new)');
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

    // Hash password if provided, otherwise generate a random one
    const passwordToUse = password || Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    // Use transaction for data integrity
    await db.transaction(async (trx) => {
      // Insert participant (ID auto-generated)
      const [newParticipant] = await trx('Participant').insert({
        "ParticipantFirstName": first_name,
        "ParticipantLastName": last_name,
        "ParticipantEmail": email.toLowerCase(),
        "ParticipantPhone": phone,
        "ParticipantDOB": date_of_birth || null,
        "ParticipantFieldOfInterest": field_of_interest,
        "ParticipantCity": city,
        "ParticipantState": state,
        "ParticipantZip": zip,
        "ParticipantRole": role || 'participant',
        "Password": hashedPassword
      }).returning('ParticipantID');
      
      const participantId = newParticipant.ParticipantID || newParticipant;

      // Handle school assignment
      let schoolId = school_id;
      if (new_school && new_school.trim()) {
        // Check if school already exists
        let existingSchool = await trx('School')
          .where('SchoolName', 'ilike', new_school.trim())
          .first();
        
        if (existingSchool) {
          schoolId = existingSchool.SchoolID;
        } else {
          // Create new school
          const [newSchool] = await trx('School').insert({
            "SchoolName": new_school.trim()
          }).returning('SchoolID');
          schoolId = newSchool.SchoolID || newSchool;
        }
      }
      
      if (schoolId) {
        await trx('ParticipantSchool').insert({
          "ParticipantID": participantId,
          "SchoolID": schoolId
        });
      }

      // Handle employer assignment
      let employerId = employer_id;
      if (new_employer && new_employer.trim()) {
        // Check if employer already exists
        let existingEmployer = await trx('Employer')
          .where('EmployerName', 'ilike', new_employer.trim())
          .first();
        
        if (existingEmployer) {
          employerId = existingEmployer.EmployerID;
        } else {
          // Create new employer
          const [newEmployer] = await trx('Employer').insert({
            "EmployerName": new_employer.trim()
          }).returning('EmployerID');
          employerId = newEmployer.EmployerID || newEmployer;
        }
      }
      
      if (employerId) {
        await trx('ParticipantEmployer').insert({
          "ParticipantID": participantId,
          "EmployerID": employerId
        });
      }
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
    // Get participant with school and employer via JOINs
    const participant = await db('Participant')
      .leftJoin('ParticipantSchool', 'Participant.ParticipantID', 'ParticipantSchool.ParticipantID')
      .leftJoin('School', 'ParticipantSchool.SchoolID', 'School.SchoolID')
      .leftJoin('ParticipantEmployer', 'Participant.ParticipantID', 'ParticipantEmployer.ParticipantID')
      .leftJoin('Employer', 'ParticipantEmployer.EmployerID', 'Employer.EmployerID')
      .where('Participant.ParticipantID', req.params.id)
      .select(
        'Participant.*',
        'School.SchoolID',
        'School.SchoolName',
        'Employer.EmployerID',
        'Employer.EmployerName'
      )
      .first();
    
    if (!participant) {
      req.flash('error_msg', 'Participant not found');
      return res.redirect('/portal/participants');
    }
    
    // Get participant's milestones
    const milestones = await db('Milestone')
      .where('ParticipantID', req.params.id)
      .orderBy('MilestoneDate', 'desc');
    
    // Get participant's event history
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
    
    res.render('portal/participants/view', {
      title: `${participant.ParticipantFirstName} ${participant.ParticipantLastName} - Ella Rises Portal`,
      participant,
      milestones,
      events,
      availableMilestones: []
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    req.flash('error_msg', 'Error loading participant details: ' + error.message);
    res.redirect('/portal/participants');
  }
});

// Edit participant form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    // Get participant with current school and employer
    const participant = await db('Participant')
      .leftJoin('ParticipantSchool', 'Participant.ParticipantID', 'ParticipantSchool.ParticipantID')
      .leftJoin('School', 'ParticipantSchool.SchoolID', 'School.SchoolID')
      .leftJoin('ParticipantEmployer', 'Participant.ParticipantID', 'ParticipantEmployer.ParticipantID')
      .leftJoin('Employer', 'ParticipantEmployer.EmployerID', 'Employer.EmployerID')
      .where('Participant.ParticipantID', req.params.id)
      .select(
        'Participant.*',
        'School.SchoolID',
        'School.SchoolName',
        'Employer.EmployerID',
        'Employer.EmployerName'
      )
      .first();
    
    if (!participant) {
      req.flash('error_msg', 'Participant not found');
      return res.redirect('/portal/participants');
    }
    
    // Get all schools and employers for dropdowns
    const schools = await db('School').orderBy('SchoolName');
    const employers = await db('Employer').orderBy('EmployerName');
    
    res.render('portal/participants/form', {
      title: 'Edit Participant - Ella Rises Portal',
      participant,
      schools,
      employers,
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
      school_id, new_school, employer_id, new_employer, field_of_interest, 
      city, state, zip, role
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !date_of_birth || !city || !state || !zip || !field_of_interest) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect(`/portal/participants/${req.params.id}/edit`);
    }
    
    // Validate school or employer
    if (!school_id && !new_school) {
      req.flash('error_msg', 'School is required (select existing or enter new)');
      return res.redirect(`/portal/participants/${req.params.id}/edit`);
    }
    
    if (!employer_id && !new_employer) {
      req.flash('error_msg', 'Employer is required (select existing or enter new)');
      return res.redirect(`/portal/participants/${req.params.id}/edit`);
    }
    
    const participantId = req.params.id;
    
    await db.transaction(async (trx) => {
      // Update participant basic info
      await trx('Participant').where('ParticipantID', participantId).update({
        "ParticipantFirstName": first_name,
        "ParticipantLastName": last_name,
        "ParticipantEmail": email,
        "ParticipantPhone": phone,
        "ParticipantDOB": date_of_birth || null,
        "ParticipantFieldOfInterest": field_of_interest,
        "ParticipantCity": city,
        "ParticipantState": state,
        "ParticipantZip": zip,
        "ParticipantRole": role
      });
      
      // Handle school update
      // First, remove existing school association
      await trx('ParticipantSchool').where('ParticipantID', participantId).del();
      
      let schoolId = school_id;
      if (new_school && new_school.trim()) {
        // Check if school already exists
        let existingSchool = await trx('School')
          .where('SchoolName', 'ilike', new_school.trim())
          .first();
        
        if (existingSchool) {
          schoolId = existingSchool.SchoolID;
        } else {
          // Create new school
          const [newSchoolRecord] = await trx('School').insert({
            "SchoolName": new_school.trim()
          }).returning('SchoolID');
          schoolId = newSchoolRecord.SchoolID || newSchoolRecord;
        }
      }
      
      if (schoolId) {
        await trx('ParticipantSchool').insert({
          "ParticipantID": participantId,
          "SchoolID": schoolId
        });
      }

      // Handle employer update
      // First, remove existing employer association
      await trx('ParticipantEmployer').where('ParticipantID', participantId).del();
      
      let employerId = employer_id;
      if (new_employer && new_employer.trim()) {
        // Check if employer already exists
        let existingEmployer = await trx('Employer')
          .where('EmployerName', 'ilike', new_employer.trim())
          .first();
        
        if (existingEmployer) {
          employerId = existingEmployer.EmployerID;
        } else {
          // Create new employer
          const [newEmployerRecord] = await trx('Employer').insert({
            "EmployerName": new_employer.trim()
          }).returning('EmployerID');
          employerId = newEmployerRecord.EmployerID || newEmployerRecord;
        }
      }
      
      if (employerId) {
        await trx('ParticipantEmployer').insert({
          "ParticipantID": participantId,
          "EmployerID": employerId
        });
      }
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
    // CASCADE should handle junction table cleanup
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
    const { title, date } = req.body;
    
    await db('Milestone').insert({
      "ParticipantID": req.params.id,
      "MilestoneTitle": title,
      "MilestoneDate": date || new Date()
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
