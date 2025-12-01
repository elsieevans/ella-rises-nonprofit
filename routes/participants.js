const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all participants
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, grade, status } = req.query;
    
    let query = db('participants').orderBy('last_name', 'asc');
    
    if (search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }
    
    if (grade) {
      query = query.where('grade_level', grade);
    }
    
    if (status === 'active') {
      query = query.where('is_active', true);
    } else if (status === 'inactive') {
      query = query.where('is_active', false);
    }
    
    const participants = await query;
    
    // Get unique grade levels for filter
    const grades = await db('participants')
      .distinct('grade_level')
      .whereNotNull('grade_level')
      .orderBy('grade_level');
    
    res.render('portal/participants/index', {
      title: 'Participants - Ella Rises Portal',
      participants,
      grades: grades.map(g => g.grade_level),
      filters: { search, grade, status }
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
  try {
    const {
      first_name, last_name, email, phone, date_of_birth,
      school, grade_level, parent_guardian_name, parent_guardian_email,
      parent_guardian_phone, interests, notes, is_active
    } = req.body;
    
    await db('participants').insert({
      first_name,
      last_name,
      email,
      phone,
      date_of_birth: date_of_birth || null,
      school,
      grade_level,
      parent_guardian_name,
      parent_guardian_email,
      parent_guardian_phone,
      interests,
      notes,
      is_active: is_active === 'on',
      enrollment_date: new Date()
    });
    
    req.flash('success_msg', 'Participant added successfully');
    res.redirect('/portal/participants');
  } catch (error) {
    console.error('Error creating participant:', error);
    req.flash('error_msg', 'Error adding participant. Email may already exist.');
    res.redirect('/portal/participants/new');
  }
});

// View participant details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const participant = await db('participants').where('id', req.params.id).first();
    
    if (!participant) {
      req.flash('error_msg', 'Participant not found');
      return res.redirect('/portal/participants');
    }
    
    // Get participant's milestones
    const milestones = await db('participant_milestones as pm')
      .join('milestones as m', 'pm.milestone_id', 'm.id')
      .where('pm.participant_id', req.params.id)
      .select('m.*', 'pm.achieved_date', 'pm.notes as achievement_notes', 'pm.id as pm_id')
      .orderBy('pm.achieved_date', 'desc');
    
    // Get participant's event history
    const events = await db('event_participants as ep')
      .join('events as e', 'ep.event_id', 'e.id')
      .where('ep.participant_id', req.params.id)
      .select('e.*', 'ep.status', 'ep.registered_at')
      .orderBy('e.event_date', 'desc');
    
    // Get available milestones for assignment
    const availableMilestones = await db('milestones')
      .where('is_active', true)
      .whereNotIn('id', milestones.map(m => m.id))
      .orderBy('sort_order');
    
    res.render('portal/participants/view', {
      title: `${participant.first_name} ${participant.last_name} - Ella Rises Portal`,
      participant,
      milestones,
      events,
      availableMilestones
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
    const participant = await db('participants').where('id', req.params.id).first();
    
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
      school, grade_level, parent_guardian_name, parent_guardian_email,
      parent_guardian_phone, interests, notes, is_active
    } = req.body;
    
    await db('participants').where('id', req.params.id).update({
      first_name,
      last_name,
      email,
      phone,
      date_of_birth: date_of_birth || null,
      school,
      grade_level,
      parent_guardian_name,
      parent_guardian_email,
      parent_guardian_phone,
      interests,
      notes,
      is_active: is_active === 'on',
      updated_at: new Date()
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
    await db('participants').where('id', req.params.id).del();
    req.flash('success_msg', 'Participant deleted successfully');
    res.redirect('/portal/participants');
  } catch (error) {
    console.error('Error deleting participant:', error);
    req.flash('error_msg', 'Error deleting participant');
    res.redirect('/portal/participants');
  }
});

// Assign milestone to participant
router.post('/:id/milestones', isAuthenticated, isManager, async (req, res) => {
  try {
    const { milestone_id, achieved_date, notes } = req.body;
    
    await db('participant_milestones').insert({
      participant_id: req.params.id,
      milestone_id,
      achieved_date,
      notes,
      verified_by: req.session.user.id
    });
    
    req.flash('success_msg', 'Milestone assigned successfully');
    res.redirect(`/portal/participants/${req.params.id}`);
  } catch (error) {
    console.error('Error assigning milestone:', error);
    req.flash('error_msg', 'Error assigning milestone');
    res.redirect(`/portal/participants/${req.params.id}`);
  }
});

// Remove milestone from participant
router.post('/:id/milestones/:pmId/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('participant_milestones').where('id', req.params.pmId).del();
    req.flash('success_msg', 'Milestone removed successfully');
    res.redirect(`/portal/participants/${req.params.id}`);
  } catch (error) {
    console.error('Error removing milestone:', error);
    req.flash('error_msg', 'Error removing milestone');
    res.redirect(`/portal/participants/${req.params.id}`);
  }
});

module.exports = router;

