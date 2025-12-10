const db = require('./db');

(async () => {
  try {
    const currentDb = await db.query(`SELECT current_database()`);
    console.log('🧠 Connected to DB:', currentDb.rows[0].current_database);

    const tables = await db.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables:', tables.rows.map(t => t.table_name));

  } catch (err) {
    console.error('❌ DB test failed:', err);
  } finally {
    process.exit();
  }
})();

