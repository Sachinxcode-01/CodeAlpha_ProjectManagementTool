const fs = require('fs');
const path = require('path');
const db = require('../config/db');

function initDb() {
  console.log('Initializing TaskFlow database schema...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute DDL script
  db.exec(schemaSql);
  console.log('TaskFlow database schema initialized successfully.');
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
