const express = require('express');
const router = express.Router();
const { isAuthenticated, isManager } = require('../middleware/auth');
const db = require('../config/database');

// List all donations
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = db('Donation')
      .leftJoin('Participant', 'Donation.ParticipantID', 'Participant.ParticipantID')
      .select(
        'Donation.*',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName',
        'Participant.ParticipantEmail'
      )
      .orderBy('Donation.DonationDate', 'desc');
    
    if (search) {
      query = query.where(function() {
        this.where('Participant.ParticipantFirstName', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantLastName', 'ilike', `%${search}%`)
          .orWhere('Participant.ParticipantEmail', 'ilike', `%${search}%`);
      });
    }
    
    const donations = await query;
    
    // Get aggregate stats
    const stats = await db('Donation')
      .select(
        db.raw('SUM("DonationAmount") as total'),
        db.raw('COUNT(*) as count'),
        db.raw('AVG("DonationAmount") as average')
      )
      .first();
    
    res.render('portal/donations/index', {
      title: 'Donations - Ella Rises Portal',
      donations,
      stats,
      campaigns: [], // Removed as not in schema
      donationTypes: [], // Removed as not in schema
      filters: { search }
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
    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');
    
    res.render('portal/donations/form', {
      title: 'Add Donation - Ella Rises Portal',
      donation: {},
      participants,
      isEdit: false,
      // Removed arrays not supported by schema
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
      participant_id, amount, donation_date, donation_no
    } = req.body;
    
    // Calculate total donations for this participant (if that's what TotalDonations means)
    // For now, just inserting the record.
    
    await db('Donation').insert({
      "ParticipantID": participant_id,
      "DonationAmount": parseFloat(amount),
      "DonationDate": donation_date || new Date(),
      "DonationNo": parseInt(donation_no) || null,
      "TotalDonations": parseFloat(amount) // Placeholder logic
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
    const donation = await db('Donation')
      .leftJoin('Participant', 'Donation.ParticipantID', 'Participant.ParticipantID')
      .where('Donation.DonationID', req.params.id)
      .select(
        'Donation.*',
        'Participant.ParticipantFirstName',
        'Participant.ParticipantLastName',
        'Participant.ParticipantEmail'
      )
      .first();
    
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
    const donation = await db('Donation').where('DonationID', req.params.id).first();
    
    if (!donation) {
      req.flash('error_msg', 'Donation not found');
      return res.redirect('/portal/donations');
    }
    
    const participants = await db('Participant')
      .select('ParticipantID', 'ParticipantFirstName', 'ParticipantLastName')
      .orderBy('ParticipantLastName');
    
    res.render('portal/donations/form', {
      title: 'Edit Donation - Ella Rises Portal',
      donation,
      participants,
      isEdit: true
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
      participant_id, amount, donation_date, donation_no
    } = req.body;
    
    await db('Donation').where('DonationID', req.params.id).update({
      "ParticipantID": participant_id,
      "DonationAmount": parseFloat(amount),
      "DonationDate": donation_date || new Date(),
      "DonationNo": parseInt(donation_no) || null,
      "TotalDonations": parseFloat(amount)
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
    await db('Donation').where('DonationID', req.params.id).del();
    req.flash('success_msg', 'Donation deleted successfully');
    res.redirect('/portal/donations');
  } catch (error) {
    console.error('Error deleting donation:', error);
    req.flash('error_msg', 'Error deleting donation');
    res.redirect('/portal/donations');
  }
});

module.exports = router;
