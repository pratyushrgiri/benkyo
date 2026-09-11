const { readData, writeData } = require('../utils/fileStore');
const { generateToken } = require('../utils/token');
const { registerUser, verifyCredentials, sanitizeUser } = require('../services/userService');
const { tokensPath } = require('../middleware/authMiddleware');

async function register(req, res) {
  const result = await registerUser(req.body || {});
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({ user: result.user });
}

async function login(req, res) {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required.' });
  }

  const user = await verifyCredentials({ identifier, password });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken();
  const tokens = await readData(tokensPath, []);
  tokens.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeData(tokensPath, tokens);

  return res.json({ token, user: sanitizeUser(user) });
}

async function logout(req, res) {
  const tokens = await readData(tokensPath, []);
  const nextTokens = tokens.filter((tokenRecord) => tokenRecord.token !== req.token);
  await writeData(tokensPath, nextTokens);
  return res.json({ message: 'Logged out successfully.' });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  logout,
  me,
};
