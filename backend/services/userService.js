const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/fileStore');
const { isValidEmail, isNonEmptyString } = require('../utils/validation');

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
const usersPath = path.join(dataDir, 'users.json');

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function getUsers() {
  return readData(usersPath, []);
}

async function saveUsers(users) {
  await writeData(usersPath, users);
}

async function findUserByEmailOrUsername(value) {
  const users = await getUsers();
  const normalized = String(value || '').toLowerCase();
  return users.find(
    (user) => user.email.toLowerCase() === normalized || user.username.toLowerCase() === normalized,
  );
}

async function findUserByEmail(email) {
  const users = await getUsers();
  const normalized = String(email || '').toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized);
}

async function findUserById(id) {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

async function registerUser({ username, email, password }) {
  if (!isNonEmptyString(username) || !isValidEmail(email) || !isNonEmptyString(password) || password.length < 6) {
    return { error: 'Please provide valid username, email, and password (minimum 6 characters).' };
  }

  const users = await getUsers();

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'Email is already registered.' };
  }

  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return { error: 'Username is already taken.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `user_${uuidv4()}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);

  return { user: sanitizeUser(user) };
}

async function verifyCredentials({ identifier, password }) {
  const user = await findUserByEmailOrUsername(identifier);
  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
  }

  return user;
}

async function updateUser(userId, updates) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return { error: 'User not found.' };
  }

  const nextUsername = updates.username?.trim();
  const nextEmail = updates.email?.trim().toLowerCase();

  if (nextUsername && users.some((u, i) => i !== index && u.username.toLowerCase() === nextUsername.toLowerCase())) {
    return { error: 'Username is already taken.' };
  }

  if (nextEmail && !isValidEmail(nextEmail)) {
    return { error: 'Please provide a valid email.' };
  }

  if (nextEmail && users.some((u, i) => i !== index && u.email.toLowerCase() === nextEmail)) {
    return { error: 'Email is already registered.' };
  }

  users[index] = {
    ...users[index],
    username: nextUsername || users[index].username,
    email: nextEmail || users[index].email,
  };

  await saveUsers(users);
  return { user: sanitizeUser(users[index]) };
}

module.exports = {
  sanitizeUser,
  findUserByEmail,
  findUserById,
  registerUser,
  verifyCredentials,
  updateUser,
};
