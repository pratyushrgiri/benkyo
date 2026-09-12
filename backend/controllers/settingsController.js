const { getSettings, updateSettings } = require("../services/settingsService");

async function fetchSettings(req, res) {
  const settings = await getSettings(req.user.id);
  return res.json({ settings });
}

async function saveSettings(req, res) {
  const settings = await updateSettings(req.user.id, req.body || {});
  return res.json({ settings });
}

module.exports = {
  fetchSettings,
  saveSettings,
};
