/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('participants').del();
  
  await knex('participants').insert([
    {
      first_name: 'Isabella',
      last_name: 'Martinez',
      email: 'isabella.m@email.com',
      phone: '801-555-0101',
      date_of_birth: '2010-03-15',
      school: 'Mountain View Middle School',
      grade_level: '8th Grade',
      parent_guardian_name: 'Carmen Martinez',
      parent_guardian_email: 'carmen.m@email.com',
      parent_guardian_phone: '801-555-0102',
      interests: 'Coding, Robotics, Art',
      enrollment_date: '2024-01-15',
      is_active: true
    },
    {
      first_name: 'Sophia',
      last_name: 'Rodriguez',
      email: 'sophia.r@email.com',
      phone: '801-555-0201',
      date_of_birth: '2009-07-22',
      school: 'Valley High School',
      grade_level: '9th Grade',
      parent_guardian_name: 'Miguel Rodriguez',
      parent_guardian_email: 'miguel.r@email.com',
      parent_guardian_phone: '801-555-0202',
      interests: 'Mathematics, Engineering, Dance',
      enrollment_date: '2024-02-01',
      is_active: true
    },
    {
      first_name: 'Mia',
      last_name: 'Hernandez',
      email: 'mia.h@email.com',
      phone: '801-555-0301',
      date_of_birth: '2011-11-08',
      school: 'Sunrise Elementary',
      grade_level: '6th Grade',
      parent_guardian_name: 'Rosa Hernandez',
      parent_guardian_email: 'rosa.h@email.com',
      parent_guardian_phone: '801-555-0302',
      interests: 'Science, Music, Writing',
      enrollment_date: '2024-03-10',
      is_active: true
    },
    {
      first_name: 'Camila',
      last_name: 'Lopez',
      email: 'camila.l@email.com',
      phone: '801-555-0401',
      date_of_birth: '2008-05-30',
      school: 'Central High School',
      grade_level: '10th Grade',
      parent_guardian_name: 'Ana Lopez',
      parent_guardian_email: 'ana.l@email.com',
      parent_guardian_phone: '801-555-0402',
      interests: 'Technology, Leadership, Photography',
      enrollment_date: '2024-01-20',
      is_active: true
    },
    {
      first_name: 'Valentina',
      last_name: 'Sanchez',
      email: 'valentina.s@email.com',
      phone: '801-555-0501',
      date_of_birth: '2010-09-12',
      school: 'Mountain View Middle School',
      grade_level: '7th Grade',
      parent_guardian_name: 'Elena Sanchez',
      parent_guardian_email: 'elena.s@email.com',
      parent_guardian_phone: '801-555-0502',
      interests: 'Art, Biology, Community Service',
      enrollment_date: '2024-04-05',
      is_active: true
    }
  ]);
};

