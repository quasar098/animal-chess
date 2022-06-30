const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('./db/chess.db')

module.exports = db;
