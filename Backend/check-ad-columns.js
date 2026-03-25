const { Client } = require('pg');

async function checkColumns() {
  const connectionString = 'postgresql://postgres:123@localhost:5433/newsaggregator';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'advertisements'
      ORDER BY ordinal_position;
    `);
    console.log('--- COLUMNS IN advertisements TABLE ---');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkColumns();
