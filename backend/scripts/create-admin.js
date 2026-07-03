import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

async function createAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_TX2wJjvgW4Qh@ep-soft-dawn-ahmf6sz2.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Admin credentials
    const email = 'admin@pvadvisory.com';
    const password = 'Admin123!';
    const full_name = 'Admin User';
    const role = 'admin';

    // Check if admin already exists
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('ℹ️  Admin user already exists:');
      console.log('   Email:', existingUser.rows[0].email);
      console.log('   Role:', existingUser.rows[0].role);
      console.log('\n✓ Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password_hash = $1, email_verified = true WHERE email = $2',
        [passwordHash, email]
      );
      
      console.log('✓ Password updated successfully!\n');
    } else {
      console.log('Creating new admin user...\n');
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert admin user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id, email, full_name, role`,
        [email, passwordHash, full_name, role]
      );

      console.log('✓ Admin user created successfully!\n');
      console.log('User Details:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Name:', result.rows[0].full_name);
      console.log('   Role:', result.rows[0].role);
    }

    console.log('\n' + '='.repeat(50));
    console.log('LOGIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log('Email:    ' + email);
    console.log('Password: ' + password);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✓ Done!');
    process.exit(0);
  }
}

createAdminUser();
