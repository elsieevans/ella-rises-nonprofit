const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all milestones
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { category, status } = req.query;
    
    let query = db('milestones').orderBy('sort_order', 'asc');
    
    if (category) {
      query = query.where('category', category);
    }
    
    if (status === 'active') {
      query = query.where('is_active', true);
    } else if (status === 'inactive') {
      query = query.where('is_active', false);
    }
    
    const milestones = await query;
    
    // Get achievement counts for each milestone
    const achievementCounts = await db('participant_milestones')
      .select('milestone_id')
      .count('id as count')
      .groupBy('milestone_id');
    
    const countsMap = {};
    achievementCounts.forEach(a => {
      countsMap[a.milestone_id] = parseInt(a.count);
    });
    
    milestones.forEach(m => {
      m.achievement_count = countsMap[m.id] || 0;
    });
    
    const categories = ['academic', 'leadership', 'technical', 'artistic', 'community', 'personal'];
    
    res.render('portal/milestones/index', {
      title: 'Milestones - Ella Rises Portal',
      milestones,
      categories,
      filters: { category, status }
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    req.flash('error_msg', 'Error loading milestones');
    res.redirect('/portal/dashboard');
  }
});

// New milestone form
router.get('/new', isAuthenticated, isManager, (req, res) => {
  res.render('portal/milestones/form', {
    title: 'Add Milestone - Ella Rises Portal',
    milestone: {},
    isEdit: false,
    categories: ['academic', 'leadership', 'technical', 'artistic', 'community', 'personal']
  });
});

// Create milestone
router.post('/', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      name, description, category, points, badge_icon, is_active, sort_order
    } = req.body;
    
    await db('milestones').insert({
      name,
      description,
      category,
      points: parseInt(points) || 0,
      badge_icon,
      is_active: is_active === 'on',
      sort_order: parseInt(sort_order) || 0
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
    const milestone = await db('milestones').where('id', req.params.id).first();
    
    if (!milestone) {
      req.flash('error_msg', 'Milestone not found');
      return res.redirect('/portal/milestones');
    }
    
    // Get participants who achieved this milestone
    const achievers = await db('participant_milestones as pm')
      .join('participants as p', 'pm.participant_id', 'p.id')
      .leftJoin('users as u', 'pm.verified_by', 'u.id')
      .where('pm.milestone_id', req.params.id)
      .select(
        'p.*',
        'pm.achieved_date',
        'pm.notes as achievement_notes',
        'pm.id as pm_id',
        'u.first_name as verified_by_first',
        'u.last_name as verified_by_last'
      )
      .orderBy('pm.achieved_date', 'desc');
    
    res.render('portal/milestones/view', {
      title: `${milestone.name} - Ella Rises Portal`,
      milestone,
      achievers
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
    const milestone = await db('milestones').where('id', req.params.id).first();
    
    if (!milestone) {
      req.flash('error_msg', 'Milestone not found');
      return res.redirect('/portal/milestones');
    }
    
    res.render('portal/milestones/form', {
      title: 'Edit Milestone - Ella Rises Portal',
      milestone,
      isEdit: true,
      categories: ['academic', 'leadership', 'technical', 'artistic', 'community', 'personal']
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
      name, description, category, points, badge_icon, is_active, sort_order
    } = req.body;
    
    await db('milestones').where('id', req.params.id).update({
      name,
      description,
      category,
      points: parseInt(points) || 0,
      badge_icon,
      is_active: is_active === 'on',
      sort_order: parseInt(sort_order) || 0,
      updated_at: new Date()
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
    await db('milestones').where('id', req.params.id).del();
    req.flash('success_msg', 'Milestone deleted successfully');
    res.redirect('/portal/milestones');
  } catch (error) {
    console.error('Error deleting milestone:', error);
    req.flash('error_msg', 'Error deleting milestone');
    res.redirect('/portal/milestones');
  }
});

module.exports = router;

