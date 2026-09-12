const {
  listSubjects,
  createSubject,
  deleteSubject,
} = require("../services/subjectService");

async function getSubjects(req, res) {
  const subjects = await listSubjects(req.user.id);
  return res.json({ subjects });
}

async function addSubject(req, res) {
  const result = await createSubject(req.user.id, req.body?.name);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({ subject: result.subject });
}

async function removeSubject(req, res) {
  const deleted = await deleteSubject(req.user.id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Subject not found." });
  }

  return res.json({ message: "Subject deleted." });
}

module.exports = {
  getSubjects,
  addSubject,
  removeSubject,
};
