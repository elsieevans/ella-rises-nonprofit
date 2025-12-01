/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('participant_milestones').del();
  
  await knex('participant_milestones').insert([
    // Isabella Martinez - Participant 1
    { participant_id: 1, milestone_id: 1, achieved_date: '2024-01-20', notes: 'Attended first coding workshop' },
    { participant_id: 1, milestone_id: 3, achieved_date: '2024-03-15', notes: 'Completed Python basics course' },
    { participant_id: 1, milestone_id: 2, achieved_date: '2024-05-01', notes: 'Reached 5 events milestone' },
    
    // Sophia Rodriguez - Participant 2
    { participant_id: 2, milestone_id: 1, achieved_date: '2024-02-05', notes: 'First event - Math workshop' },
    { participant_id: 2, milestone_id: 5, achieved_date: '2024-04-20', notes: 'Competed in regional robotics' },
    { participant_id: 2, milestone_id: 2, achieved_date: '2024-06-15', notes: 'Very engaged participant' },
    { participant_id: 2, milestone_id: 9, achieved_date: '2024-09-01', notes: 'Made honor roll at Valley High' },
    
    // Mia Hernandez - Participant 3
    { participant_id: 3, milestone_id: 1, achieved_date: '2024-03-15', notes: 'Mariachi workshop' },
    { participant_id: 3, milestone_id: 8, achieved_date: '2024-06-01', notes: 'Created beautiful heritage art piece' },
    
    // Camila Lopez - Participant 4
    { participant_id: 4, milestone_id: 1, achieved_date: '2024-01-25', notes: 'Leadership panel' },
    { participant_id: 4, milestone_id: 6, achieved_date: '2024-04-10', notes: 'Mentored 3 new participants' },
    { participant_id: 4, milestone_id: 7, achieved_date: '2024-07-20', notes: 'Spoke at summer showcase' },
    { participant_id: 4, milestone_id: 2, achieved_date: '2024-05-20', notes: 'Active in multiple programs' },
    { participant_id: 4, milestone_id: 11, achieved_date: '2024-11-01', notes: 'Applied to UVU and BYU' },
    
    // Valentina Sanchez - Participant 5
    { participant_id: 5, milestone_id: 1, achieved_date: '2024-04-10', notes: 'Art workshop' },
    { participant_id: 5, milestone_id: 10, achieved_date: '2024-08-15', notes: '15 hours of community service' },
    { participant_id: 5, milestone_id: 8, achieved_date: '2024-09-20', notes: 'Heritage celebration project' }
  ]);
};

