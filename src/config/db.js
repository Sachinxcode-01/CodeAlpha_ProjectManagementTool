const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/taskflow.db');
const dbDir = path.dirname(dbPath);

// Ensure the database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite
const db = new Database(dbPath);

// Enforce foreign key constraints and enable WAL mode for performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

module.exports = db;
