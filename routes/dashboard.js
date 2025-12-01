const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Dashboard home
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get counts for dashboard cards
    const participantCount = await db('participants').where('is_active', true).count('id as count').first();
    const eventCount = await db('events').where('is_active', true).count('id as count').first();
    const surveyCount = await db('surveys').count('id as count').first();
    const donationTotal = await db('donations').sum('amount as total').first();
    const milestoneCount = await db('participant_milestones').count('id as count').first();
    
    // Get recent participants
    const recentParticipants = await db('participants')
      .where('is_active', true)
      .orderBy('created_at', 'desc')
      .limit(5);
    
    // Get upcoming events
    const upcomingEvents = await db('events')
      .where('is_active', true)
      .where('event_date', '>=', new Date().toISOString().split('T')[0])
      .orderBy('event_date', 'asc')
      .limit(5);
    
    // Get recent donations
    const recentDonations = await db('donations')
      .orderBy('donation_date', 'desc')
      .limit(5);
    
    res.render('portal/dashboard', {
      title: 'Dashboard - Ella Rises Portal',
      stats: {
        participants: participantCount?.count || 0,
        events: eventCount?.count || 0,
        surveys: surveyCount?.count || 0,
        donations: donationTotal?.total || 0,
        milestones: milestoneCount?.count || 0
      },
      recentParticipants,
      upcomingEvents,
      recentDonations
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Error loading dashboard data');
    res.render('portal/dashboard', {
      title: 'Dashboard - Ella Rises Portal',
      stats: { participants: 0, events: 0, surveys: 0, donations: 0, milestones: 0 },
      recentParticipants: [],
      upcomingEvents: [],
      recentDonations: []
    });
  }
});

// API endpoint for chart data
router.get('/api/chart-data', isAuthenticated, async (req, res) => {
  try {
    // Donation trends by month
    const donationsByMonth = await db('donations')
      .select(db.raw("TO_CHAR(donation_date, 'YYYY-MM') as month"))
      .sum('amount as total')
      .groupByRaw("TO_CHAR(donation_date, 'YYYY-MM')")
      .orderBy('month', 'asc');
    
    // Events by type
    const eventsByType = await db('events')
      .select('event_type')
      .count('id as count')
      .where('is_active', true)
      .groupBy('event_type');
    
    // Survey satisfaction scores
    const surveyScores = await db('surveys')
      .select(
        db.raw('AVG(satisfaction_score) as avg_satisfaction'),
        db.raw('AVG(usefulness_score) as avg_usefulness'),
        db.raw('AVG(recommendation_score) as avg_recommendation')
      )
      .first();
    
    // Milestones by category
    const milestonesByCategory = await db('milestones as m')
      .leftJoin('participant_milestones as pm', 'm.id', 'pm.milestone_id')
      .select('m.category')
      .count('pm.id as achieved_count')
      .groupBy('m.category');
    
    // Participants by grade level
    const participantsByGrade = await db('participants')
      .select('grade_level')
      .count('id as count')
      .where('is_active', true)
      .whereNotNull('grade_level')
      .groupBy('grade_level');
    
    res.json({
      donationsByMonth,
      eventsByType,
      surveyScores,
      milestonesByCategory,
      participantsByGrade
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ error: 'Error fetching chart data' });
  }
});

module.exports = router;

