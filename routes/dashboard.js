const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Dashboard home
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get counts for dashboard cards
    const participantCount = await db('Participant').count('ParticipantID as count').first();
    const eventCount = await db('Event').count('EventID as count').first();
    const surveyCount = await db('Survey').count('SurveyID as count').first();
    const donationTotal = await db('Donation').sum('DonationAmount as total').first();
    const milestoneCount = await db('Milestone').count('MilestoneID as count').first();
    
    // Get available years for donations
    const availableYears = await db('Donation')
      .select(db.raw('EXTRACT(YEAR FROM "DonationDate") as year'))
      .distinct()
      .orderBy('year', 'desc');

    // Get recent participants
    const recentParticipants = await db('Participant')
      .orderBy('ParticipantID', 'desc')
      .limit(5);
    
    // Get upcoming events
    const upcomingEvents = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('Event.*', 'EventDetails.EventName')
      .where('Event.EventDateTimeStart', '>=', new Date())
      .orderBy('Event.EventDateTimeStart', 'asc')
      .limit(5);
    
    // Get recent donations (exclude null dates and show most recent first)
    const recentDonations = await db('Donation')
      .leftJoin('Participant', 'Donation.ParticipantID', 'Participant.ParticipantID')
      .select('Donation.*', 'Participant.ParticipantFirstName', 'Participant.ParticipantLastName')
      .whereNotNull('Donation.DonationDate')
      .orderBy('Donation.DonationDate', 'desc')
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
      availableYears: availableYears.map(y => y.year),
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
      availableYears: [],
      recentParticipants: [],
      upcomingEvents: [],
      recentDonations: []
    });
  }
});

// API endpoint for chart data
router.get('/api/chart-data', isAuthenticated, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    // Donation trends by month
    const donationsByMonth = await db('Donation')
      .whereRaw('EXTRACT(YEAR FROM "DonationDate") = ?', [year])
      .select(db.raw("TO_CHAR(\"DonationDate\", 'YYYY-MM') as month"))
      .sum('DonationAmount as total')
      .groupByRaw("TO_CHAR(\"DonationDate\", 'YYYY-MM')")
      .orderBy('month', 'asc');
      
    // Calculate total for the year
    const yearTotal = donationsByMonth.reduce((sum, record) => sum + parseFloat(record.total || 0), 0);
    
    // Events by type
    const eventsByType = await db('Event')
      .join('EventDetails', 'Event.EventDetailsID', 'EventDetails.EventDetailsID')
      .select('EventDetails.EventType')
      .count('Event.EventID as count')
      .groupBy('EventDetails.EventType');
    
    // Survey satisfaction scores
    const surveyScores = await db('Survey')
      .select(
        db.raw('AVG("SurveySatisfactionScore") as avg_satisfaction'),
        db.raw('AVG("SurveyUsefulnessScore") as avg_usefulness'),
        db.raw('AVG("SurveyRecommendationScore") as avg_recommendation')
      )
      .first();
    
    // Milestones by Title (replacing Category)
    const milestonesByCategory = await db('Milestone')
      .select('MilestoneTitle as category')
      .count('MilestoneID as achieved_count')
      .groupBy('MilestoneTitle')
      .orderBy('achieved_count', 'desc')
      .limit(5);
    
    // Participants by School - using JOIN through ParticipantSchool -> School
    const participantsByGrade = await db('ParticipantSchool')
      .join('School', 'ParticipantSchool.SchoolID', 'School.SchoolID')
      .select('School.SchoolName as grade_level')
      .count('ParticipantSchool.ParticipantID as count')
      .groupBy('School.SchoolName')
      .orderBy('count', 'desc')
      .limit(5);
    
    res.json({
      donationsByMonth,
      yearTotal,
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
