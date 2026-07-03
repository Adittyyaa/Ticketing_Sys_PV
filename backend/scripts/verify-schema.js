import pg from 'pg';
const { Client } = pg;

async function verifySchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_TX2wJjvgW4Qh@ep-soft-dawn-ahmf6sz2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check tickets table
    console.log('=== TICKETS TABLE ===');
    const ticketsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tickets'
      ORDER BY ordinal_position
    `);
    
    const expectedTicketColumns = [
      'id', 'user_id', 'title', 'description', 'status', 'priority', 
      'category_id', 'assigned_to', 'created_at', 'updated_at', 'resolved_at'
    ];
    
    const ticketColumns = ticketsResult.rows.map(r => r.column_name);
    console.log('Found columns:', ticketColumns.join(', '));
    
    const missingTickets = expectedTicketColumns.filter(col => !ticketColumns.includes(col));
    if (missingTickets.length > 0) {
      console.log('⚠️  Missing columns:', missingTickets.join(', '));
    } else {
      console.log('✓ All expected columns present');
    }

    // Check solutions table
    console.log('\n=== SOLUTIONS TABLE ===');
    const solutionsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'solutions'
      ORDER BY ordinal_position
    `);
    
    const expectedSolutionColumns = [
      'id', 'title', 'description', 'steps', 'category_id', 'category_name',
      'tags', 'is_published', 'view_count', 'helpful_count', 'created_by',
      'created_at', 'updated_at'
    ];
    
    const solutionColumns = solutionsResult.rows.map(r => r.column_name);
    console.log('Found columns:', solutionColumns.join(', '));
    
    const missingSolutions = expectedSolutionColumns.filter(col => !solutionColumns.includes(col));
    if (missingSolutions.length > 0) {
      console.log('⚠️  Missing columns:', missingSolutions.join(', '));
    } else {
      console.log('✓ All expected columns present');
    }

    // Check users table
    console.log('\n=== USERS TABLE ===');
    const usersResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    const expectedUserColumns = [
      'id', 'email', 'password_hash', 'full_name', 'role', 
      'phone', 'job_title', 'company', 'email_verified',
      'created_at', 'updated_at'
    ];
    
    const userColumns = usersResult.rows.map(r => r.column_name);
    console.log('Found columns:', userColumns.join(', '));
    
    const missingUsers = expectedUserColumns.filter(col => !userColumns.includes(col));
    if (missingUsers.length > 0) {
      console.log('⚠️  Missing columns:', missingUsers.join(', '));
    } else {
      console.log('✓ All expected columns present');
    }

    // Check categories table
    console.log('\n=== CATEGORIES TABLE ===');
    const categoriesResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    if (categoriesResult.rows.length === 0) {
      console.log('⚠️  Categories table does not exist');
    } else {
      const categoryColumns = categoriesResult.rows.map(r => r.column_name);
      console.log('Found columns:', categoryColumns.join(', '));
    }

    // Count records
    console.log('\n=== RECORD COUNTS ===');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM tickets'),
      client.query('SELECT COUNT(*) as count FROM solutions'),
    ]);
    
    console.log('Users:', counts[0].rows[0].count);
    console.log('Tickets:', counts[1].rows[0].count);
    console.log('Solutions:', counts[2].rows[0].count);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Schema verification complete!');
    process.exit(0);
  }
}

verifySchema();
