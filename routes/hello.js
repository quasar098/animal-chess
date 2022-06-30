const router = require("express").Router();
const db = require("../database/database");

router.get("/hello", async (req, res) => {
    res.json("hello world!");
});

module.exports = router;
