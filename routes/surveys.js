const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all surveys
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { event_id, score_filter } = req.query;
    
    let query = db('Survey')
      .leftJoin('Event', 'Survey.EventID', 'Event.EventID')
      .leftJoin('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .leftJoin('Participant', 'Survey.ParticipantID', 'Participant.ParticipantID')
      .select(
        'Survey.*',
        'EventDetails.EventName as event_title',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName'
      )
      .orderByRaw('"SurveySubmissionDate" DESC NULLS LAST');
    
    if (event_id) {
      query = query.where('Survey.EventID', event_id);
    }
    
    if (score_filter === 'high') {
      query = query.where('Survey.SurveyRecommendationScore', '>=', 8);
    } else if (score_filter === 'medium') {
      query = query.whereBetween('Survey.SurveyRecommendationScore', [5, 7]);
    } else if (score_filter === 'low') {
      query = query.where('Survey.SurveyRecommendationScore', '<', 5);
    }
    
    const surveys = await query;
    
    // Get events for filter dropdown
    const events = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.EventID', 'EventDetails.EventName', 'Event.EventDateTimeStart')
      .orderBy('Event.EventDateTimeStart', 'desc');
    
    // Get aggregate stats
    const stats = await db('Survey')
      .select(
        db.raw('AVG("SurveySatisfactionScore") as avg_satisfaction'),
        db.raw('AVG("SurveyUsefulnessScore") as avg_usefulness'),
        db.raw('AVG("SurveyRecommendationScore") as avg_recommendation'),
        db.raw('COUNT(*) as total_responses')
      )
      .first();
    
    res.render('portal/surveys/index', {
      title: 'Surveys - Ella Rises Portal',
      surveys,
      events: events.map(e => ({ id: e.EventID, title: e.EventName })),
      stats,
      filters: { event_id, score_filter }
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    req.flash('error_msg', 'Error loading surveys');
    res.redirect('/portal/dashboard');
  }
});

// New survey form
router.get('/new', isAuthenticated, isManager, async (req, res) => {
  try {
    const events = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.EventID', 'EventDetails.EventName')
      .orderBy('Event.EventDateTimeStart', 'desc');
    
    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');
    
    res.render('portal/surveys/form', {
      title: 'Add Survey - Ella Rises Portal',
      survey: {},
      events: events.map(e => ({ id: e.EventID, title: e.EventName })),
      participants,
      isEdit: false
    });
  } catch (error) {
    console.error('Error loading survey form:', error);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/portal/surveys');
  }
});

// Create survey
router.post('/', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      event_id, participant_id, satisfaction_score, usefulness_score,
      recommendation_score, instructor_score, comments, survey_date
    } = req.body;
    
    // Calculate NPS Bucket
    let npsBucket = 'Passive';
    const recScore = parseInt(recommendation_score);
    if (recScore >= 9) npsBucket = 'Promoter';
    else if (recScore <= 6) npsBucket = 'Detractor';

    // Calculate Overall Score (simple average)
    const overallScore = Math.round((parseInt(satisfaction_score) + parseInt(usefulness_score) + parseInt(instructor_score || 0) + recScore) / 4);

    await db('Survey').insert({
      "EventID": event_id || null,
      "ParticipantID": participant_id || null,
      "SurveySatisfactionScore": parseInt(satisfaction_score),
      "SurveyUsefulnessScore": parseInt(usefulness_score),
      "SurveyInstructorScore": parseInt(instructor_score) || 0,
      "SurveyRecommendationScore": recScore,
      "SurveyOverallScore": overallScore,
      "SurveyNPSBucket": npsBucket,
      "SurveyComments": comments,
      "SurveySubmissionDate": survey_date || new Date()
    });
    
    req.flash('success_msg', 'Survey added successfully');
    res.redirect('/portal/surveys');
  } catch (error) {
    console.error('Error creating survey:', error);
    req.flash('error_msg', 'Error adding survey');
    res.redirect('/portal/surveys/new');
  }
});

// View survey details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const survey = await db('Survey')
      .leftJoin('Event', 'Survey.EventID', 'Event.EventID')
      .leftJoin('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .leftJoin('Participant', 'Survey.ParticipantID', 'Participant.ParticipantID')
      .where('Survey.SurveyID', req.params.id)
      .select(
        'Survey.*',
        'EventDetails.EventName as event_title',
        'Event.EventDateTimeStart as event_date',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName',
        'Participant.ParticipantEmail'
      )
      .first();
    
    if (!survey) {
      req.flash('error_msg', 'Survey not found');
      return res.redirect('/portal/surveys');
    }
    
    res.render('portal/surveys/view', {
      title: 'Survey Details - Ella Rises Portal',
      survey
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    req.flash('error_msg', 'Error loading survey');
    res.redirect('/portal/surveys');
  }
});

// Edit survey form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const survey = await db('Survey').where('SurveyID', req.params.id).first();
    
    if (!survey) {
      req.flash('error_msg', 'Survey not found');
      return res.redirect('/portal/surveys');
    }
    
    const events = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.EventID', 'EventDetails.EventName')
      .orderBy('Event.EventDateTimeStart', 'desc');

    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');
    
    res.render('portal/surveys/form', {
      title: 'Edit Survey - Ella Rises Portal',
      survey,
      events: events.map(e => ({ id: e.EventID, title: e.EventName })),
      participants,
      isEdit: true
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    req.flash('error_msg', 'Error loading survey');
    res.redirect('/portal/surveys');
  }
});

// Update survey
router.post('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      event_id, participant_id, satisfaction_score, usefulness_score,
      recommendation_score, instructor_score, comments, survey_date
    } = req.body;
    
    // Calculate NPS Bucket
    let npsBucket = 'Passive';
    const recScore = parseInt(recommendation_score);
    if (recScore >= 9) npsBucket = 'Promoter';
    else if (recScore <= 6) npsBucket = 'Detractor';

    const overallScore = Math.round((parseInt(satisfaction_score) + parseInt(usefulness_score) + parseInt(instructor_score || 0) + recScore) / 4);

    await db('Survey').where('SurveyID', req.params.id).update({
      "EventID": event_id || null,
      "ParticipantID": participant_id || null,
      "SurveySatisfactionScore": parseInt(satisfaction_score),
      "SurveyUsefulnessScore": parseInt(usefulness_score),
      "SurveyInstructorScore": parseInt(instructor_score) || 0,
      "SurveyRecommendationScore": recScore,
      "SurveyOverallScore": overallScore,
      "SurveyNPSBucket": npsBucket,
      "SurveyComments": comments,
      "SurveySubmissionDate": survey_date || new Date()
    });
    
    req.flash('success_msg', 'Survey updated successfully');
    res.redirect(`/portal/surveys/${req.params.id}`);
  } catch (error) {
    console.error('Error updating survey:', error);
    req.flash('error_msg', 'Error updating survey');
    res.redirect(`/portal/surveys/${req.params.id}/edit`);
  }
});

// Delete survey
router.post('/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('Survey').where('SurveyID', req.params.id).del();
    req.flash('success_msg', 'Survey deleted successfully');
    res.redirect('/portal/surveys');
  } catch (error) {
    console.error('Error deleting survey:', error);
    req.flash('error_msg', 'Error deleting survey');
    res.redirect('/portal/surveys');
  }
});

module.exports = router;
