import pg from 'pg';
const { Client } = pg;

async function seedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_TX2wJjvgW4Qh@ep-soft-dawn-ahmf6sz2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Seed Categories
    console.log('=== SEEDING CATEGORIES ===');
    const categories = [
      { name: 'Technical Support', description: 'Technical issues and bugs', color: '#3b82f6' },
      { name: 'Account & Billing', description: 'Account management and billing inquiries', color: '#10b981' },
      { name: 'Feature Request', description: 'New feature suggestions', color: '#8b5cf6' },
      { name: 'General Inquiry', description: 'General questions and information', color: '#f59e0b' },
      { name: 'Bug Report', description: 'Software bugs and errors', color: '#ef4444' },
      { name: 'Documentation', description: 'Documentation requests and updates', color: '#06b6d4' },
    ];

    for (const category of categories) {
      const existing = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO categories (name, description, color, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [category.name, category.description, category.color]
        );
        console.log('✓ Created category:', category.name);
      } else {
        console.log('  - Category already exists:', category.name);
      }
    }

    // Seed Ticket Types
    console.log('\n=== SEEDING TICKET TYPES ===');
    const ticketTypes = [
      { name: 'Issue', description: 'Problem or bug report', icon: '🐛' },
      { name: 'Question', description: 'General question', icon: '❓' },
      { name: 'Request', description: 'Feature or service request', icon: '✨' },
      { name: 'Incident', description: 'System incident or outage', icon: '🚨' },
    ];

    for (const type of ticketTypes) {
      const existing = await client.query(
        'SELECT id FROM ticket_types WHERE name = $1',
        [type.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO ticket_types (name, description, icon, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [type.name, type.description, type.icon]
        );
        console.log('✓ Created ticket type:', type.name);
      } else {
        console.log('  - Ticket type already exists:', type.name);
      }
    }

    // Seed Tags
    console.log('\n=== SEEDING TAGS ===');
    const tags = [
      { name: 'urgent', color: '#ef4444' },
      { name: 'frontend', color: '#3b82f6' },
      { name: 'backend', color: '#10b981' },
      { name: 'database', color: '#f59e0b' },
      { name: 'api', color: '#8b5cf6' },
      { name: 'ui', color: '#ec4899' },
      { name: 'performance', color: '#f97316' },
    ];

    for (const tag of tags) {
      const existing = await client.query(
        'SELECT id FROM tags WHERE name = $1',
        [tag.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO tags (name, color, created_at)
           VALUES ($1, $2, NOW())`,
          [tag.name, tag.color]
        );
        console.log('✓ Created tag:', tag.name);
      } else {
        console.log('  - Tag already exists:', tag.name);
      }
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM categories'),
      client.query('SELECT COUNT(*) as count FROM ticket_types'),
      client.query('SELECT COUNT(*) as count FROM tags'),
      client.query('SELECT COUNT(*) as count FROM users'),
    ]);

    console.log('Categories:', counts[0].rows[0].count);
    console.log('Ticket Types:', counts[1].rows[0].count);
    console.log('Tags:', counts[2].rows[0].count);
    console.log('Users:', counts[3].rows[0].count);

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Seeding complete!');
    process.exit(0);
  }
}

seedData();
