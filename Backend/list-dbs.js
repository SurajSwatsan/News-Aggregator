const { Client } = require('pg');

async function listDbs() {
  const connectionString = 'postgresql://postgres:123@localhost:5433/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Databases on port 5433:');
    res.rows.forEach(row => console.log(`- ${row.datname}`));
    
    // Also check the content of newsaggregator if it exists
    for (const db of res.rows) {
        if (db.datname === 'newsaggregator' || db.datname.includes('news')) {
            console.log(`\nChecking database: ${db.datname}`);
            // We'd need a new client for each DB, but for now just list them.
        }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

listDbs();
