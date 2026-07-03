import pg from 'pg';
const { Client } = pg;

async function addCategoryNameColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_TX2wJjvgW4Qh@ep-soft-dawn-ahmf6sz2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Add category_name column
    await client.query(`
      ALTER TABLE solutions 
      ADD COLUMN IF NOT EXISTS category_name VARCHAR(100)
    `);
    console.log('✓ Added category_name column to solutions table');

    // Create index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_solutions_category_name 
      ON solutions(category_name)
    `);
    console.log('✓ Created index on category_name');

    // Verify the column exists
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'solutions' AND column_name = 'category_name'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Verified: category_name column exists');
      console.log('  Type:', result.rows[0].data_type);
    } else {
      console.log('✗ Warning: category_name column not found');
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Migration complete!');
    process.exit(0);
  }
}

addCategoryNameColumn();
