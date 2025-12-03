const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all events
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, type, status } = req.query;
    
    let query = db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select(
        'Event.*',
        'EventDetails.EventName',
        'EventDetails.EventType',
        'EventDetails.EventDescription',
        'EventDetails.EventDefaultCapacity'
      )
      .orderByRaw('"Event"."EventDateTimeStart" DESC NULLS LAST');
    
    if (search) {
      query = query.where(function() {
        this.where('EventDetails.EventName', 'ilike', `%${search}%`)
          .orWhere('Event.EventLocation', 'ilike', `%${search}%`);
      });
    }
    
    if (type) {
      query = query.where('EventDetails.EventType', type);
    }
    
    if (status === 'upcoming') {
      query = query.where('Event.EventDateTimeStart', '>=', new Date());
    } else if (status === 'past') {
      query = query.where('Event.EventDateTimeStart', '<', new Date());
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
      location, max_participants
    } = req.body;
    
    // Transaction to ensure consistency
    await db.transaction(async (trx) => {
      // 1. Create EventDetails
      const [eventDetails] = await trx('EventDetails').insert({
        "EventName": title,
        "EventDescription": description,
        "EventType": event_type,
        "EventDefaultCapacity": max_participants || 0
      }).returning('EventDetailsID'); // returning ID for Postgres

      const eventDetailsId = eventDetails.EventDetailsID || eventDetails; // Handle returning object or value

      // Combine date and time
      const startDateTime = event_date && start_time ? `${event_date}T${start_time}` : null;
      const endDateTime = event_date && end_time ? `${event_date}T${end_time}` : null;

      // 2. Create Event
      await trx('Event').insert({
        "EventDetailsID": eventDetailsId,
        "EventDateTimeStart": startDateTime,
        "EventDateTimeEnd": endDateTime,
        "EventLocation": location,
        "EventCapacity": max_participants,
        "RegistrationCreatedAt": new Date()
      });
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
    const event = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .where('Event.EventID', req.params.id)
      .select(
        'Event.*',
        'EventDetails.EventName',
        'EventDetails.EventType',
        'EventDetails.EventDescription',
        'EventDetails.EventDefaultCapacity'
      )
      .first();
    
    if (!event) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/portal/events');
    }
    
    // Get registered participants via Registration table
    const participants = await db('Registration')
      .join('Participant', 'Registration.ParticipantID', 'Participant.ParticipantID')
      .where('Registration.EventID', req.params.id)
      .select('Participant.*', 'Registration.RegistrationStatus', 'Registration.RegistrationCheckInTime', 'Registration.RegistrationID')
      .orderBy('Participant.ParticipantLastName');
    
    // Get surveys for this event - with error handling for missing columns
    let surveys = [];
    let surveyStats = { total_responses: 0, avg_satisfaction: null, avg_usefulness: null, avg_recommendation: null };
    
    try {
      surveys = await db('Survey')
        .leftJoin('Participant', 'Survey.ParticipantID', 'Participant.ParticipantID')
        .where('Survey.EventID', req.params.id)
        .select('Survey.*', 'Participant.ParticipantFirstName', 'Participant.ParticipantLastName')
        .orderBy('Survey.SurveySubmissionDate', 'desc');
      
      // Calculate survey stats
      surveyStats = await db('Survey')
        .where('EventID', req.params.id)
        .select(
          db.raw('AVG("SurveySatisfactionScore") as avg_satisfaction'),
          db.raw('AVG("SurveyUsefulnessScore") as avg_usefulness'),
          db.raw('AVG("SurveyRecommendationScore") as avg_recommendation'),
          db.raw('COUNT(*) as total_responses')
        )
        .first();
    } catch (surveyError) {
      console.error('Error fetching surveys (table or columns may not exist):', surveyError.message);
      // Continue without survey data
    }
    
    // Get available participants (simple list, not checking double booking for now)
    const availableParticipants = await db('Participant')
      .whereNotIn('ParticipantID', participants.map(p => p.ParticipantID))
      .orderBy('ParticipantLastName');
    
    res.render('portal/events/view', {
      title: `${event.EventName} - Ella Rises Portal`,
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
    const event = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .where('Event.EventID', req.params.id)
      .select(
        'Event.*',
        'EventDetails.EventName',
        'EventDetails.EventType',
        'EventDetails.EventDescription',
        'EventDetails.EventDefaultCapacity'
      )
      .first();
    
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
      location, max_participants
    } = req.body;
    
    // Get EventDetailsID
    const event = await db('Event').where('EventID', req.params.id).first();
    if (!event) {
      throw new Error('Event not found');
    }

    await db.transaction(async (trx) => {
      // Update EventDetails
      await trx('EventDetails').where('EventDetailsID', event.EventDetailsID).update({
        "EventName": title,
        "EventDescription": description,
        "EventType": event_type,
        "EventDefaultCapacity": max_participants
      });

      const startDateTime = event_date && start_time ? `${event_date}T${start_time}` : null;
      const endDateTime = event_date && end_time ? `${event_date}T${end_time}` : null;

      // Update Event
      await trx('Event').where('EventID', req.params.id).update({
        "EventDateTimeStart": startDateTime,
        "EventDateTimeEnd": endDateTime,
        "EventLocation": location,
        "EventCapacity": max_participants
      });
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
    // Delete Event (EventDetails might persist if shared, but we'll assume 1:1 for now or leave it)
    await db('Event').where('EventID', req.params.id).del();
    req.flash('success_msg', 'Event deleted successfully');
    res.redirect('/portal/events');
  } catch (error) {
    console.error('Error deleting event:', error);
    req.flash('error_msg', 'Error deleting event');
    res.redirect('/portal/events');
  }
});

// Register participant
router.post('/:id/participants', isAuthenticated, isManager, async (req, res) => {
  try {
    const { participant_id } = req.body;
    
    await db('Registration').insert({
      "EventID": req.params.id,
      "ParticipantID": participant_id,
      "RegistrationStatus": 'registered',
      "RegistrationCheckInTime": null
    });
    
    req.flash('success_msg', 'Participant registered successfully');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error registering participant:', error);
    req.flash('error_msg', 'Error registering participant');
    res.redirect(`/portal/events/${req.params.id}`);
  }
});

// Update participant status (Check-in)
router.post('/:id/participants/:regId/status', isAuthenticated, isManager, async (req, res) => {
  try {
    const { status } = req.body;
    
    await db('Registration').where('RegistrationID', req.params.regId).update({
      "RegistrationStatus": status,
      "RegistrationCheckInTime": status === 'attended' ? new Date() : null,
      "RegistrationAttendedFlag": status === 'attended' ? 1 : 0
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
router.post('/:id/participants/:regId/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('Registration').where('RegistrationID', req.params.regId).del();
    req.flash('success_msg', 'Participant removed from event');
    res.redirect(`/portal/events/${req.params.id}`);
  } catch (error) {
    console.error('Error removing participant:', error);
    req.flash('error_msg', 'Error removing participant');
    res.redirect(`/portal/events/${req.params.id}`);
  }
});

module.exports = router;
