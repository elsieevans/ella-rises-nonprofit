/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('events').del();
  
  await knex('events').insert([
    {
      title: 'Introduction to Coding with Python',
      description: 'Learn the basics of programming with Python. This beginner-friendly workshop covers variables, loops, and creating your first program.',
      event_type: 'steam',
      event_date: '2024-12-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      location: 'UVU Engineering Building, Room 201',
      venue_name: 'Utah Valley University',
      max_participants: 25,
      current_participants: 18,
      instructor: 'Dr. Jennifer Walsh',
      partner_organization: 'UVU Computer Science Department',
      is_active: true
    },
    {
      title: 'Mariachi Music Workshop',
      description: 'Explore the rich tradition of Mariachi music while learning guitar, violin, or trumpet basics. Embrace your heritage through music!',
      event_type: 'arts',
      event_date: '2024-12-18',
      start_time: '14:00:00',
      end_time: '16:30:00',
      location: 'Community Center, Main Hall',
      venue_name: 'Provo Community Center',
      max_participants: 30,
      current_participants: 24,
      instructor: 'Maestro Carlos Ramirez',
      partner_organization: 'Local Mariachi Association',
      is_active: true
    },
    {
      title: 'Women in Leadership Panel',
      description: 'Hear from successful women leaders in STEM fields. Q&A session and networking opportunity included.',
      event_type: 'leadership',
      event_date: '2024-12-20',
      start_time: '18:00:00',
      end_time: '20:00:00',
      location: 'BYU Tanner Building, Auditorium',
      venue_name: 'Brigham Young University',
      max_participants: 100,
      current_participants: 67,
      instructor: 'Various Speakers',
      partner_organization: 'BYU Marriott School of Business',
      is_active: true
    },
    {
      title: 'Robotics Club Meeting',
      description: 'Weekly robotics club meeting. Work on team projects and prepare for upcoming competitions.',
      event_type: 'steam',
      event_date: '2024-12-22',
      start_time: '15:00:00',
      end_time: '17:00:00',
      location: 'Tech Lab, Building C',
      venue_name: 'Innovation Hub',
      max_participants: 20,
      current_participants: 15,
      instructor: 'Coach Amanda Peters',
      partner_organization: 'FIRST Robotics',
      is_active: true,
      is_recurring: true
    },
    {
      title: 'Art & Identity Workshop',
      description: 'Express your cultural identity through visual arts. Create a personal art piece that celebrates your heritage.',
      event_type: 'arts',
      event_date: '2025-01-05',
      start_time: '11:00:00',
      end_time: '14:00:00',
      location: 'Art Studio, Room 105',
      venue_name: 'Creative Arts Center',
      max_participants: 15,
      current_participants: 12,
      instructor: 'Artist Lucia Flores',
      partner_organization: 'Local Arts Council',
      is_active: true
    },
    {
      title: 'STEM Career Fair',
      description: 'Meet representatives from tech companies, universities, and research institutions. Learn about career paths in STEM.',
      event_type: 'community',
      event_date: '2025-01-15',
      start_time: '09:00:00',
      end_time: '15:00:00',
      location: 'Convention Center, Hall A',
      venue_name: 'Utah County Convention Center',
      max_participants: 200,
      current_participants: 145,
      instructor: null,
      partner_organization: 'Utah STEM Action Center',
      is_active: true
    }
  ]);
};

