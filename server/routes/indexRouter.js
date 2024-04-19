const express = require('express');
const Database = require('../modules/database');

const router = express.Router();

console.log(Database);
router.get('/database', (req, res) => {
  res.send({ status: Database.status });
});

module.exports = router;
