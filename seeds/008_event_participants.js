/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('event_participants').del();
  
  await knex('event_participants').insert([
    // Python Coding Workshop (Event 1)
    { event_id: 1, participant_id: 1, status: 'attended' },
    { event_id: 1, participant_id: 2, status: 'attended' },
    { event_id: 1, participant_id: 4, status: 'attended' },
    
    // Mariachi Workshop (Event 2)
    { event_id: 2, participant_id: 3, status: 'attended' },
    { event_id: 2, participant_id: 5, status: 'attended' },
    { event_id: 2, participant_id: 1, status: 'attended' },
    
    // Women in Leadership Panel (Event 3)
    { event_id: 3, participant_id: 4, status: 'attended' },
    { event_id: 3, participant_id: 1, status: 'attended' },
    { event_id: 3, participant_id: 2, status: 'registered' },
    
    // Robotics Club (Event 4)
    { event_id: 4, participant_id: 2, status: 'attended' },
    { event_id: 4, participant_id: 1, status: 'registered' },
    
    // Art & Identity Workshop (Event 5)
    { event_id: 5, participant_id: 5, status: 'attended' },
    { event_id: 5, participant_id: 3, status: 'registered' },
    
    // STEM Career Fair (Event 6)
    { event_id: 6, participant_id: 1, status: 'registered' },
    { event_id: 6, participant_id: 2, status: 'registered' },
    { event_id: 6, participant_id: 3, status: 'registered' },
    { event_id: 6, participant_id: 4, status: 'registered' },
    { event_id: 6, participant_id: 5, status: 'registered' }
  ]);
};

