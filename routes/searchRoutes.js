const express = require("express");
const router = express.Router();
const { searchAll } = require("../controllers/searchController");

// Public unified search route
router.get("/", searchAll);

module.exports = router;
