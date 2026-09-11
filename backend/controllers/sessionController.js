const { createCompletedSession, listUserSessions, getUserSessionById } = require('../services/sessionService');
const { findSubject } = require('../services/subjectService');

async function getSessions(req, res) {
  const sessions = await listUserSessions(req.user.id);
  return res.json({ sessions });
}

async function getSession(req, res) {
  const session = await getUserSessionById(req.user.id, req.params.id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found.' });
  }

  return res.json({ session });
}

async function createSession(req, res) {
  const payload = { ...(req.body || {}) };

  if (payload.subjectId) {
    const subject = await findSubject(req.user.id, payload.subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    payload.subjectName = subject.name;
  }

  const result = await createCompletedSession(req.user.id, payload);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({ session: result.session });
}

module.exports = {
  getSessions,
  getSession,
  createSession,
};
