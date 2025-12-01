const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all events
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, type, status } = req.query;
    
    let query = db('events').orderBy('event_date', 'desc');
    
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('location', 'ilike', `%${search}%`)
          .orWhere('instructor', 'ilike', `%${search}%`);
      });
    }
    
    if (type) {
      query = query.where('event_type', type);
    }
    
    if (status === 'active') {
      query = query.where('is_active', true);
    } else if (status === 'inactive') {
      query = query.where('is_active', false);
    } else if (status === 'upcoming') {
      query = query.where('event_date', '>=', new Date().toISOString().split('T')[0]);
    } else if (status === 'past') {
      query = query.where('event_date', '<', new Date().toISOString().split('T')[0]);
    }
    
    const events = await query;
    
    const eventTypes = ['workshop', 'mentoring', 'leadership', 'steam', 'arts', 'community', 'other'];
    
    res.render('portal/events/index', {
      title: 'Events - Ella Rises Portal',
      events,
      eventTypes,
      filters: { search, type, status }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    req.flash('error_msg', 'Error loading events');
    res.redirect('/portal/dashboard');
  }
});

// New event form
router.get('/new', isAuthenticated, isManager, (req, res) => {
  res.render('portal/events/form', {
    title: 'Add Event - Ella Rises Portal',
    event: {},
    isEdit: false,
    eventTypes: ['workshop', 'mentoring', 'leadership', 'steam', 'arts', 'community', 'other']
  });
});

// Create event
router.post('/', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      title, description, event_type, event_date, start_time, end_time,
      location, venue_name, max_participants, instructor, partner_organization,
      is_active, is_recurring, notes
    } = req.body;
    
    await db('events').insert({
      title,
      description,
      event_type,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location,
      venue_name,
      max_participants: max_participants || null,
      current_participants: 0,
      instructor,
      partner_organization,
      is_active: is_active === 'on',
      is_recurring: is_recurring === 'on',
      notes
    });
    
    req.flash('success_msg', 'Event created successfully');
    res.redirect('/portal/events');
  } catch (error) {
    console.error('Error creating event:', error);
    req.flash('error_msg', 'Error creating event');
    res.redirect('/portal/events/new');
  }
});

// View event details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const event = await db('events').where('id', req.params.id).first();
    
    if (!event) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/portal/events');
    }
    
    // Get registered participants
    const participants = await db('event_participants as ep')
      .join('participants as p', 'ep.participant_id', 'p.id')
      .where('ep.event_id', req.params.id)
      .select('p.*', 'ep.status', 'ep.registered_at', 'ep.id as ep_id')
      .orderBy('p.last_name');
    
    // Get surveys for this event
    const surveys = await db('surveys as s')
      .leftJoin('participants as p', 's.participant_id', 'p.id')
      .where('s.event_id', req.params.id)
      .select('s.*', 'p.first_name', 'p.last_name')
      .orderBy('s.survey_date', 'desc');
    
    // Calculate survey stats
    const surveyStats = await db('surveys')
      .where('event_id', req.params.id)
      .select(
        db.raw('AVG(satisfaction_score) as avg_satisfaction'),
        db.raw('AVG(usefulness_score) as avg_usefulness'),
        db.raw('AVG(recommendation_score) as avg_recommendation'),
        db.raw('COUNT(*) as total_responses')
      )
      .first();
    
    // Get available participants to register
    const availableParticipants = await db('participants')
      .where('is_active', true)
      .whereNotIn('id', participants.map(p => p.id))
      .orderBy('last_name');
    
    res.render('portal/events/view', {
      title: `${event.title} - Ella Rises Portal`,
      event,
      participants,
      surveys,
      surveyStats,
      availableParticipants
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    req.flash('error_msg', 'Error loading event details');
    res.redirect('/portal/events');
  }
});

// Edit event form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const event = await db('events').where('id', req.params.id).first();
    
    if (!event) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/portal/events');
    }
    
    res.render('portal/events/form', {
      title: 'Edit Event - Ella Rises Portal',
      event,
      isEdit: true,
      eventTypes: ['workshop', 'mentoring', 'leadership', 'steam', 'arts', 'community', 'other']
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    req.flash('error_msg', 'Error loading event');
    res.redirect('/portal/events');
  }
});

// Update event
router.post('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      title, description, event_type, event_date, start_time, end_time,
      location, venue_name, max_participants, instructor, partner_organization,
      is_active, is_recurring, notes
    } = req.body;
    
    await db('events').where('id', req.params.id).update({
      title,
      description,
      event_type,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location,
      venue_name,
      max_participants: max_participants || null,
      instructor,
      partner_organization,
      is_active: is_active === 'on',
      is_recurring: is_recurring === 'on',
      notes,
      updated_at: new Date()
    });
    
    req.flash('success_msg', 'Event updated successfully');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error updating event:', error);
    req.flash('error_msg', 'Error updating event');
    res.redirect(`/portal/events/${req.params.id}/edit`);
  }
});

// Delete event
router.post('/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('events').where('id', req.params.id).del();
    req.flash('success_msg', 'Event deleted successfully');
    res.redirect('/portal/events');
  } catch (error) {
    console.error('Error deleting event:', error);
    req.flash('error_msg', 'Error deleting event');
    res.redirect('/portal/events');
  }
});

// Register participant for event
router.post('/:id/participants', isAuthenticated, isManager, async (req, res) => {
  try {
    const { participant_id } = req.body;
    
    await db('event_participants').insert({
      event_id: req.params.id,
      participant_id,
      status: 'registered'
    });
    
    // Update current participants count
    await db('events').where('id', req.params.id).increment('current_participants', 1);
    
    req.flash('success_msg', 'Participant registered successfully');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error registering participant:', error);
    req.flash('error_msg', 'Error registering participant');
    res.redirect(`/portal/events/${req.params.id}`);
  }
});

// Update participant status
router.post('/:id/participants/:epId/status', isAuthenticated, isManager, async (req, res) => {
  try {
    const { status } = req.body;
    
    await db('event_participants').where('id', req.params.epId).update({
      status,
      attended_at: status === 'attended' ? new Date() : null
    });
    
    req.flash('success_msg', 'Participant status updated');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error updating status:', error);
    req.flash('error_msg', 'Error updating participant status');
    res.redirect(`/portal/events/${req.params.id}`);
  }
});

// Remove participant from event
router.post('/:id/participants/:epId/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('event_participants').where('id', req.params.epId).del();
    await db('events').where('id', req.params.id).decrement('current_participants', 1);
    
    req.flash('success_msg', 'Participant removed from event');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error removing participant:', error);
    req.flash('error_msg', 'Error removing participant');
    res.redirect(`/portal/events/${req.params.id}`);
  }
});

module.exports = router;

