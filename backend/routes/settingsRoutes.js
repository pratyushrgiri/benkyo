const express = require('express');
const { fetchSettings, saveSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', fetchSettings);
router.put('/', saveSettings);

module.exports = router;
