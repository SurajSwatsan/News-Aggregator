const { Client } = require('pg');

async function fixAdTypes() {
  const connectionString = 'postgresql://postgres:123@localhost:5433/newsaggregator';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query(`
      UPDATE advertisements 
      SET ad_type = 'video' 
      WHERE media_url LIKE '%.mp4' AND ad_type != 'video'
    `);
    console.log(`Updated ${res.rowCount} ads to 'video' type.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fixAdTypes();
