/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('surveys').del();
  
  await knex('surveys').insert([
    {
      event_id: 1,
      participant_id: 1,
      satisfaction_score: 5,
      usefulness_score: 5,
      recommendation_score: 10,
      what_liked: 'The hands-on coding exercises were amazing! I finally understand how loops work.',
      what_improve: 'Maybe have a follow-up session for more practice.',
      additional_comments: 'Dr. Walsh was so encouraging and patient.',
      would_attend_again: true,
      survey_date: '2024-12-15'
    },
    {
      event_id: 1,
      participant_id: 2,
      satisfaction_score: 4,
      usefulness_score: 5,
      recommendation_score: 9,
      what_liked: 'Learning Python was really fun. The examples were relatable.',
      what_improve: 'Slightly longer session to cover more topics.',
      additional_comments: 'Would love to learn about web development next!',
      would_attend_again: true,
      survey_date: '2024-12-15'
    },
    {
      event_id: 2,
      participant_id: 3,
      satisfaction_score: 5,
      usefulness_score: 4,
      recommendation_score: 10,
      what_liked: 'I loved learning about my heritage through music! The guitar basics were great.',
      what_improve: 'More time to practice with the instruments.',
      additional_comments: 'Maestro Carlos is incredible!',
      would_attend_again: true,
      survey_date: '2024-12-18'
    },
    {
      event_id: 2,
      participant_id: 5,
      satisfaction_score: 5,
      usefulness_score: 5,
      recommendation_score: 10,
      what_liked: 'Connecting with my culture through Mariachi was beautiful.',
      what_improve: 'Maybe add dance elements too.',
      additional_comments: 'This made me so proud of my heritage.',
      would_attend_again: true,
      survey_date: '2024-12-18'
    },
    {
      event_id: 3,
      participant_id: 4,
      satisfaction_score: 5,
      usefulness_score: 5,
      recommendation_score: 10,
      what_liked: 'The panelists were so inspiring! Real stories of success.',
      what_improve: 'More time for Q&A would be great.',
      additional_comments: 'I now know I want to pursue engineering!',
      would_attend_again: true,
      survey_date: '2024-12-20'
    },
    {
      event_id: 3,
      participant_id: 1,
      satisfaction_score: 4,
      usefulness_score: 5,
      recommendation_score: 9,
      what_liked: 'Networking with successful women in STEM was eye-opening.',
      what_improve: 'Would appreciate more one-on-one mentoring opportunities.',
      additional_comments: 'This reinforced my passion for technology.',
      would_attend_again: true,
      survey_date: '2024-12-20'
    },
    {
      event_id: 4,
      participant_id: 2,
      satisfaction_score: 5,
      usefulness_score: 5,
      recommendation_score: 10,
      what_liked: 'Building robots is so much fun! Great teamwork experience.',
      what_improve: 'Access to more advanced parts for projects.',
      additional_comments: 'Can\'t wait for the competition!',
      would_attend_again: true,
      survey_date: '2024-12-22'
    },
    {
      event_id: 5,
      participant_id: 5,
      satisfaction_score: 5,
      usefulness_score: 4,
      recommendation_score: 9,
      what_liked: 'Expressing myself through art while celebrating my background.',
      what_improve: 'More variety in art supplies.',
      additional_comments: 'Lucia helped me discover my artistic voice.',
      would_attend_again: true,
      survey_date: '2025-01-05'
    }
  ]);
};

