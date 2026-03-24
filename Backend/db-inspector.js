const { Client } = require('pg');

async function listSchemasAndTables() {
  const connectionString = 'postgresql://postgres:123@localhost:5433/newsaggregator';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    
    console.log('--- SCHEMAS ---');
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';");
    schemas.rows.forEach(row => console.log(`- ${row.schema_name}`));

    console.log('\n--- TABLES ---');
    const tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT LIKE 'pg_%' AND table_schema != 'information_schema' ORDER BY table_schema, table_name;");
    tables.rows.forEach(row => console.log(`- ${row.table_schema}.${row.table_name}`));

    // Search for the ID in ALL tables
    const id = 'b982c7b6-b4e5-4bd7-9b57-16d5604d2f23';
    console.log(`\n--- SEARCHING FOR ID ${id} IN ALL TABLES ---`);
    for (const table of tables.rows) {
        try {
            const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${table.table_schema}' AND table_name = '${table.table_name}';`);
            const uuidColumns = columns.rows.filter(c => c.data_type === 'uuid' || c.data_type.includes('char') || c.data_type.includes('text')).map(c => c.column_name);
            
            if (uuidColumns.length > 0) {
                const whereClause = uuidColumns.map(c => `CAST("${c}" AS TEXT) = '${id}'`).join(' OR ');
                const query = `SELECT * FROM "${table.table_schema}"."${table.table_name}" WHERE ${whereClause};`;
                const searchRes = await client.query(query);
                if (searchRes.rows.length > 0) {
                    console.log(`FOUND IN ${table.table_schema}.${table.table_name}:`, searchRes.rows);
                }
            }
        } catch (err) {
            // Ignore errors for specific tables (like those without columns we can cast)
        }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

listSchemasAndTables();
