const express = require('express');
const { getStats, getActivity, getWeekly } = require('../controllers/statsController');

const router = express.Router();

router.get('/', getStats);
router.get('/activity', getActivity);
router.get('/weekly', getWeekly);

module.exports = router;
