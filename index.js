const express = require('express');
const app = express();
const path = require('path');
const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('./database/chess.db');

// json responses?
app.use(express.json());

// public routes
app.use(express.static("public"), (req, res, next) => {
    next()
});

// open to port 5000
let port = 5000;
app.listen(process.env.PORT || port, () => {
    console.log("Listening on port " + port);
})
app.get('*', (req, res) => {  // 404
  res.status(404).send('<style>h1 { font-family: Helvetica }</style><h1>THERE IS NO FILE HERE</h1>');
});
