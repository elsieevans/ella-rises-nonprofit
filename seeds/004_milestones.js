/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('milestones').del();
  
  await knex('milestones').insert([
    {
      name: 'First Workshop Attended',
      description: 'Completed your first Ella Rises workshop or event',
      category: 'personal',
      points: 10,
      badge_icon: 'star',
      sort_order: 1,
      is_active: true
    },
    {
      name: '5 Events Attended',
      description: 'Participated in 5 different Ella Rises events',
      category: 'personal',
      points: 25,
      badge_icon: 'trophy',
      sort_order: 2,
      is_active: true
    },
    {
      name: 'Coding Beginner',
      description: 'Completed an introductory coding course or workshop',
      category: 'technical',
      points: 20,
      badge_icon: 'code',
      sort_order: 3,
      is_active: true
    },
    {
      name: 'Coding Intermediate',
      description: 'Completed an intermediate-level coding project',
      category: 'technical',
      points: 40,
      badge_icon: 'laptop',
      sort_order: 4,
      is_active: true
    },
    {
      name: 'Robotics Participant',
      description: 'Participated in a robotics competition or project',
      category: 'technical',
      points: 30,
      badge_icon: 'robot',
      sort_order: 5,
      is_active: true
    },
    {
      name: 'Leadership Ambassador',
      description: 'Helped mentor or guide newer participants',
      category: 'leadership',
      points: 50,
      badge_icon: 'users',
      sort_order: 6,
      is_active: true
    },
    {
      name: 'Public Speaker',
      description: 'Presented at an event or shared your story publicly',
      category: 'leadership',
      points: 35,
      badge_icon: 'microphone',
      sort_order: 7,
      is_active: true
    },
    {
      name: 'Cultural Heritage Champion',
      description: 'Completed a project celebrating cultural heritage',
      category: 'artistic',
      points: 25,
      badge_icon: 'heart',
      sort_order: 8,
      is_active: true
    },
    {
      name: 'Academic Excellence',
      description: 'Achieved honor roll or academic recognition at school',
      category: 'academic',
      points: 45,
      badge_icon: 'graduation-cap',
      sort_order: 9,
      is_active: true
    },
    {
      name: 'Community Service Star',
      description: 'Completed 10+ hours of community service',
      category: 'community',
      points: 30,
      badge_icon: 'hand-holding-heart',
      sort_order: 10,
      is_active: true
    },
    {
      name: 'College Application Completed',
      description: 'Submitted at least one college application',
      category: 'academic',
      points: 60,
      badge_icon: 'university',
      sort_order: 11,
      is_active: true
    },
    {
      name: 'Scholarship Recipient',
      description: 'Received a scholarship for higher education',
      category: 'academic',
      points: 100,
      badge_icon: 'award',
      sort_order: 12,
      is_active: true
    }
  ]);
};

