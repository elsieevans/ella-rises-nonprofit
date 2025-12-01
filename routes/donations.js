const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all donations
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, type, campaign } = req.query;
    
    let query = db('donations').orderBy('donation_date', 'desc');
    
    if (search) {
      query = query.where(function() {
        this.where('donor_name', 'ilike', `%${search}%`)
          .orWhere('donor_email', 'ilike', `%${search}%`);
      });
    }
    
    if (type) {
      query = query.where('donation_type', type);
    }
    
    if (campaign) {
      query = query.where('campaign', 'ilike', `%${campaign}%`);
    }
    
    const donations = await query;
    
    // Get aggregate stats
    const stats = await db('donations')
      .select(
        db.raw('SUM(amount) as total'),
        db.raw('COUNT(*) as count'),
        db.raw('AVG(amount) as average')
      )
      .first();
    
    // Get unique campaigns for filter
    const campaigns = await db('donations')
      .distinct('campaign')
      .whereNotNull('campaign')
      .orderBy('campaign');
    
    const donationTypes = ['one-time', 'monthly', 'annual', 'in-kind'];
    
    res.render('portal/donations/index', {
      title: 'Donations - Ella Rises Portal',
      donations,
      stats,
      campaigns: campaigns.map(c => c.campaign),
      donationTypes,
      filters: { search, type, campaign }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    req.flash('error_msg', 'Error loading donations');
    res.redirect('/portal/dashboard');
  }
});

// New donation form
router.get('/new', isAuthenticated, isManager, async (req, res) => {
  try {
    const campaigns = await db('donations')
      .distinct('campaign')
      .whereNotNull('campaign')
      .orderBy('campaign');
    
    res.render('portal/donations/form', {
      title: 'Add Donation - Ella Rises Portal',
      donation: {},
      campaigns: campaigns.map(c => c.campaign),
      isEdit: false,
      donationTypes: ['one-time', 'monthly', 'annual', 'in-kind'],
      paymentMethods: ['credit_card', 'check', 'cash', 'bank_transfer', 'other']
    });
  } catch (error) {
    console.error('Error loading donation form:', error);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/portal/donations');
  }
});

// Create donation
router.post('/', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      donor_name, donor_email, donor_phone, amount, donation_type,
      payment_method, donation_date, campaign, is_anonymous,
      receipt_sent, thank_you_sent, notes, transaction_id
    } = req.body;
    
    await db('donations').insert({
      donor_name,
      donor_email: donor_email || null,
      donor_phone: donor_phone || null,
      amount: parseFloat(amount),
      donation_type,
      payment_method,
      donation_date,
      campaign: campaign || null,
      is_anonymous: is_anonymous === 'on',
      receipt_sent: receipt_sent === 'on',
      thank_you_sent: thank_you_sent === 'on',
      notes,
      transaction_id: transaction_id || null
    });
    
    req.flash('success_msg', 'Donation recorded successfully');
    res.redirect('/portal/donations');
  } catch (error) {
    console.error('Error creating donation:', error);
    req.flash('error_msg', 'Error recording donation');
    res.redirect('/portal/donations/new');
  }
});

// View donation details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const donation = await db('donations').where('id', req.params.id).first();
    
    if (!donation) {
      req.flash('error_msg', 'Donation not found');
      return res.redirect('/portal/donations');
    }
    
    res.render('portal/donations/view', {
      title: 'Donation Details - Ella Rises Portal',
      donation
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    req.flash('error_msg', 'Error loading donation');
    res.redirect('/portal/donations');
  }
});

// Edit donation form
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const donation = await db('donations').where('id', req.params.id).first();
    
    if (!donation) {
      req.flash('error_msg', 'Donation not found');
      return res.redirect('/portal/donations');
    }
    
    const campaigns = await db('donations')
      .distinct('campaign')
      .whereNotNull('campaign')
      .orderBy('campaign');
    
    res.render('portal/donations/form', {
      title: 'Edit Donation - Ella Rises Portal',
      donation,
      campaigns: campaigns.map(c => c.campaign),
      isEdit: true,
      donationTypes: ['one-time', 'monthly', 'annual', 'in-kind'],
      paymentMethods: ['credit_card', 'check', 'cash', 'bank_transfer', 'other']
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    req.flash('error_msg', 'Error loading donation');
    res.redirect('/portal/donations');
  }
});

// Update donation
router.post('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const {
      donor_name, donor_email, donor_phone, amount, donation_type,
      payment_method, donation_date, campaign, is_anonymous,
      receipt_sent, thank_you_sent, notes, transaction_id
    } = req.body;
    
    await db('donations').where('id', req.params.id).update({
      donor_name,
      donor_email: donor_email || null,
      donor_phone: donor_phone || null,
      amount: parseFloat(amount),
      donation_type,
      payment_method,
      donation_date,
      campaign: campaign || null,
      is_anonymous: is_anonymous === 'on',
      receipt_sent: receipt_sent === 'on',
      thank_you_sent: thank_you_sent === 'on',
      notes,
      transaction_id: transaction_id || null,
      updated_at: new Date()
    });
    
    req.flash('success_msg', 'Donation updated successfully');
    res.redirect(`/portal/donations/${req.params.id}`);
  } catch (error) {
    console.error('Error updating donation:', error);
    req.flash('error_msg', 'Error updating donation');
    res.redirect(`/portal/donations/${req.params.id}/edit`);
  }
});

// Delete donation
router.post('/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    await db('donations').where('id', req.params.id).del();
    req.flash('success_msg', 'Donation deleted successfully');
    res.redirect('/portal/donations');
  } catch (error) {
    console.error('Error deleting donation:', error);
    req.flash('error_msg', 'Error deleting donation');
    res.redirect('/portal/donations');
  }
});

module.exports = router;

