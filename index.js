const express = require('express');
const app = express();
const path = require('path');
const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('./database/chess.db');

// json responses?
app.use(express.json());

// public routes
app.use(express.static("public"));

// open to port 5000
let port = 5000;
app.listen(process.env.PORT || port, () => {
    console.log("Listening on port " + port);
})
