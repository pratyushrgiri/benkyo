const express = require('express');
const { getSessions, getSession, createSession } = require('../controllers/sessionController');

const router = express.Router();

router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/', createSession);

module.exports = router;
