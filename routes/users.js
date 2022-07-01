const router = require("express").Router();
const db = require("../database/database");

router.get("/users", async (req, res) => {
    db.all("SELECT * FROM Users", (err, rows) => {
        res.json(rows);
    });
});

router.post("/users", async (req, res) => {
    db.all("")
})

module.exports = router;
