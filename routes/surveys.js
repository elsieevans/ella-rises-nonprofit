const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all surveys
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { event_id, score_filter } = req.query;
    
    let query = db('surveys as s')
      .leftJoin('events as e', 's.event_id', 'e.id')
      .leftJoin('participants as p', 's.participant_id', 'p.id')
      .select(
        's.*',
        'e.title as event_title',
        'p.first_name',
        'p.last_name'
      )
      .orderBy('s.survey_date', 'desc');
    
    if (event_id) {
      query = query.where('s.event_id', event_id);
    }
    
    if (score_filter === 'high') {
      query = query.where('s.recommendation_score', '>=', 8);
    } else if (score_filter === 'medium') {
      query = query.whereBetween('s.recommendation_score', [5, 7]);
    } else if (score_filter === 'low') {
      query = query.where('s.recommendation_score', '<', 5);
    }
    
    const surveys = await query;
    
    // Get events for filter dropdown
    const events = await db('events')
      .select('id', 'title')
      .orderBy('event_date', 'desc');
    
    // Get aggregate stats
    const stats = await db('surveys')
      .select(
        db.raw('AVG(satisfaction_score) as avg_satisfaction'),
        db.raw('AVG(usefulness_score) as avg_usefulness'),
        db.raw('AVG(recommendation_score) as avg_recommendation'),
        db.raw('COUNT(*) as total_responses')
      )
      .first();
    
    res.render('portal/surveys/index', {
      title: 'Surveys - Ella Rises Portal',
      surveys,
      events,
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
    const events = await db('events')
      .where('is_active', true)
      .orderBy('event_date', 'desc');
    
    const participants = await db('participants')
      .where('is_active', true)
      .orderBy('last_name');
    
    res.render('portal/surveys/form', {
      title: 'Add Survey - Ella Rises Portal',
      survey: {},
      events,
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
      recommendation_score, what_liked, what_improve, additional_comments,
      would_attend_again, survey_date
    } = req.body;
    
    await db('surveys').insert({
      event_id: event_id || null,
      participant_id: participant_id || null,
      satisfaction_score: parseInt(satisfaction_score),
      usefulness_score: parseInt(usefulness_score),
      recommendation_score: parseInt(recommendation_score),
      what_liked,
      what_improve,
      additional_comments,
      would_attend_again: would_attend_again === 'on',
      survey_date: survey_date || new Date()
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
    const survey = await db('surveys as s')
      .leftJoin('events as e', 's.event_id', 'e.id')
      .leftJoin('participants as p', 's.participant_id', 'p.id')
      .where('s.id', req.params.id)
      .select(
        's.*',
        'e.title as event_title',
        'e.event_date',
        'p.first_name',
        'p.last_name',
        'p.email as participant_email'
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
    const survey = await db('surveys').where('id', req.params.id).first();
    
    if (!survey) {
      req.flash('error_msg', 'Survey not found');
      return res.redirect('/portal/surveys');
    }
    
    const events = await db('events').orderBy('event_date', 'desc');
    const participants = await db('participants').orderBy('last_name');
    
    res.render('portal/surveys/form', {
      title: 'Edit Survey - Ella Rises Portal',
      survey,
      events,
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
      recommendation_score, what_liked, what_improve, additional_comments,
      would_attend_again, survey_date
    } = req.body;
    
    await db('surveys').where('id', req.params.id).update({
      event_id: event_id || null,
      participant_id: participant_id || null,
      satisfaction_score: parseInt(satisfaction_score),
      usefulness_score: parseInt(usefulness_score),
      recommendation_score: parseInt(recommendation_score),
      what_liked,
      what_improve,
      additional_comments,
      would_attend_again: would_attend_again === 'on',
      survey_date: survey_date || new Date(),
      updated_at: new Date()
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
    await db('surveys').where('id', req.params.id).del();
    req.flash('success_msg', 'Survey deleted successfully');
    res.redirect('/portal/surveys');
  } catch (error) {
    console.error('Error deleting survey:', error);
    req.flash('error_msg', 'Error deleting survey');
    res.redirect('/portal/surveys');
  }
});

module.exports = router;

