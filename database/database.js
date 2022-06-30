const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('./database/chess.db');

module.exports = db;
