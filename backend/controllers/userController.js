const { updateUser } = require('../services/userService');

async function getUser(req, res) {
  return res.json({ user: req.user });
}

async function updateCurrentUser(req, res) {
  const result = await updateUser(req.user.id, req.body || {});
  if (result.error) {
    const status = result.error.includes('already') ? 409 : 400;
    return res.status(status).json({ message: result.error });
  }

  return res.json({ user: result.user });
}

module.exports = { getUser, updateCurrentUser };
