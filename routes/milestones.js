const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all milestone achievements
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = db('Milestone')
      .leftJoin('Participant', 'Milestone.ParticipantID', 'Participant.ParticipantID')
      .select(
        'Milestone.*',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName'
      )
      .orderBy('Milestone.MilestoneDate', 'desc');
    
    if (search) {
      query = query.where(function() {
        this.where('Milestone.MilestoneTitle', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantFirstName', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantLastName', 'ilike', `%${search}%`);
      });
    }
    
    const milestones = await query;
    
    // Aggregate counts by Title (to show "Popular Milestones")
    const counts = await db('Milestone')
      .select('MilestoneTitle')
      .count('MilestoneID as count')
      .groupBy('MilestoneTitle')
      .orderBy('count', 'desc')
      .limit(5);

    res.render('portal/milestones/index', {
      title: 'Milestones - Ella Rises Portal',
      milestones,
      popular: counts,
      filters: { search }
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    req.flash('error_msg', 'Error loading milestones');
    res.redirect('/portal/dashboard');
  }
});

// New milestone form
router.get('/new', isAuthenticated, isManager, async (req, res) => {
  try {
    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');

    res.render('portal/milestones/form', {
      title: 'Add Milestone - Ella Rises Portal',
      milestone: {},
      participants,
      isEdit: false
    });
  } catch (error) {
    console.error('Error loading form:', error);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/portal/milestones');
  }
});

// Create milestone
router.post('/', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      participant_id, title, date, milestone_no
    } = req.body;
    
    await db('Milestone').insert({
      "ParticipantID": participant_id,
      "MilestoneTitle": title,
      "MilestoneDate": date || new Date(),
      "MilestoneNo": parseInt(milestone_no) || null
    });
    
    req.flash('success_msg', 'Milestone created successfully');
    res.redirect('/portal/milestones');
  } catch (error) {
    console.error('Error creating milestone:', error);
    req.flash('error_msg', 'Error creating milestone');
    res.redirect('/portal/milestones/new');
  }
});

// View milestone details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const milestone = await db('Milestone')
      .leftJoin('Participant', 'Milestone.ParticipantID', 'Participant.ParticipantID')
      .where('Milestone.MilestoneID', req.params.id)
      .select(
        'Milestone.*',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName'
      )
      .first();
    
    if (!milestone) {
      req.flash('error_msg', 'Milestone not found');
      return res.redirect('/portal/milestones');
    }
    
    res.render('portal/milestones/view', {
      title: 'Milestone Details - Ella Rises Portal',
      milestone
    });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    req.flash('error_msg', 'Error loading milestone');
    res.redirect('/portal/milestones');
  }
});

// Edit milestone form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const milestone = await db('Milestone').where('MilestoneID', req.params.id).first();
    
    if (!milestone) {
      req.flash('error_msg', 'Milestone not found');
      return res.redirect('/portal/milestones');
    }
    
    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');
    
    res.render('portal/milestones/form', {
      title: 'Edit Milestone - Ella Rises Portal',
      milestone,
      participants,
      isEdit: true
    });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    req.flash('error_msg', 'Error loading milestone');
    res.redirect('/portal/milestones');
  }
});

// Update milestone
router.post('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      participant_id, title, date, milestone_no
    } = req.body;
    
    await db('Milestone').where('MilestoneID', req.params.id).update({
      "ParticipantID": participant_id,
      "MilestoneTitle": title,
      "MilestoneDate": date || new Date(),
      "MilestoneNo": parseInt(milestone_no) || null
    });
    
    req.flash('success_msg', 'Milestone updated successfully');
    res.redirect(`/portal/milestones/${req.params.id}`);
  } catch (error) {
    console.error('Error updating milestone:', error);
    req.flash('error_msg', 'Error updating milestone');
    res.redirect(`/portal/milestones/${req.params.id}/edit`);
  }
});

// Delete milestone
router.post('/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('Milestone').where('MilestoneID', req.params.id).del();
    req.flash('success_msg', 'Milestone deleted successfully');
    res.redirect('/portal/milestones');
  } catch (error) {
    console.error('Error deleting milestone:', error);
    req.flash('error_msg', 'Error deleting milestone');
    res.redirect('/portal/milestones');
  }
});

module.exports = router;
