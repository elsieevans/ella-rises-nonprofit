/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('donations').del();
  
  await knex('donations').insert([
    {
      donor_name: 'Jennifer & Mark Thompson',
      donor_email: 'jthompson@email.com',
      donor_phone: '801-555-1001',
      amount: 5000.00,
      donation_type: 'annual',
      payment_method: 'check',
      donation_date: '2024-01-10',
      campaign: 'Annual Fund 2024',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true,
      notes: 'Long-time supporters'
    },
    {
      donor_name: 'Utah Valley University Foundation',
      donor_email: 'foundation@uvu.edu',
      amount: 15000.00,
      donation_type: 'annual',
      payment_method: 'bank_transfer',
      donation_date: '2024-02-01',
      campaign: 'STEAM Partnership Grant',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true,
      notes: 'Partnership funding for coding workshops'
    },
    {
      donor_name: 'Maria Santos',
      donor_email: 'msantos@email.com',
      amount: 100.00,
      donation_type: 'monthly',
      payment_method: 'credit_card',
      donation_date: '2024-03-01',
      campaign: 'Monthly Giving Circle',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true
    },
    {
      donor_name: 'Anonymous Donor',
      amount: 2500.00,
      donation_type: 'one-time',
      payment_method: 'credit_card',
      donation_date: '2024-04-15',
      campaign: 'Spring Fundraiser',
      is_anonymous: true,
      receipt_sent: true,
      thank_you_sent: false,
      notes: 'Wishes to remain anonymous'
    },
    {
      donor_name: 'Tech Company Inc.',
      donor_email: 'giving@techcompany.com',
      amount: 10000.00,
      donation_type: 'one-time',
      payment_method: 'bank_transfer',
      donation_date: '2024-05-20',
      campaign: 'Robotics Program Sponsor',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true,
      notes: 'Corporate sponsorship for robotics equipment'
    },
    {
      donor_name: 'Community Foundation of Utah',
      donor_email: 'grants@cfutah.org',
      amount: 7500.00,
      donation_type: 'one-time',
      payment_method: 'check',
      donation_date: '2024-06-01',
      campaign: 'Leadership Development Grant',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true
    },
    {
      donor_name: 'Robert & Linda Garcia',
      donor_email: 'rgarcia@email.com',
      amount: 250.00,
      donation_type: 'one-time',
      payment_method: 'credit_card',
      donation_date: '2024-07-04',
      campaign: 'Summer Programs',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true
    },
    {
      donor_name: 'Arts Council Grant',
      donor_email: 'artscouncil@utah.gov',
      amount: 5000.00,
      donation_type: 'annual',
      payment_method: 'bank_transfer',
      donation_date: '2024-08-15',
      campaign: 'Cultural Arts Programs',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true,
      notes: 'State grant for Mariachi and art programs'
    },
    {
      donor_name: 'Sarah Mitchell',
      donor_email: 'smitchell@email.com',
      amount: 50.00,
      donation_type: 'monthly',
      payment_method: 'credit_card',
      donation_date: '2024-09-01',
      campaign: 'Monthly Giving Circle',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true
    },
    {
      donor_name: 'BYU Community Engagement',
      donor_email: 'engagement@byu.edu',
      amount: 8000.00,
      donation_type: 'annual',
      payment_method: 'bank_transfer',
      donation_date: '2024-10-01',
      campaign: 'University Partnership',
      is_anonymous: false,
      receipt_sent: true,
      thank_you_sent: true,
      notes: 'Support for leadership panels and mentoring'
    }
  ]);
};

