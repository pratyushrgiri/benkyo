const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/fileStore');
const { isNonEmptyString } = require('../utils/validation');

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
const subjectsPath = path.join(dataDir, 'subjects.json');

async function getSubjects() {
  return readData(subjectsPath, []);
}

async function listSubjects(userId) {
  const subjects = await getSubjects();
  return subjects.filter((subject) => subject.userId === userId);
}

async function createSubject(userId, name) {
  if (!isNonEmptyString(name)) {
    return { error: 'Subject name is required.' };
  }

  const subjects = await getSubjects();
  const trimmedName = name.trim();
  const exists = subjects.some(
    (subject) => subject.userId === userId && subject.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (exists) {
    return { error: 'Subject already exists.' };
  }

  const subject = {
    id: `sub_${uuidv4()}`,
    userId,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };

  subjects.push(subject);
  await writeData(subjectsPath, subjects);

  return { subject };
}

async function deleteSubject(userId, subjectId) {
  const subjects = await getSubjects();
  const index = subjects.findIndex((subject) => subject.id === subjectId && subject.userId === userId);

  if (index === -1) {
    return false;
  }

  subjects.splice(index, 1);
  await writeData(subjectsPath, subjects);
  return true;
}

async function findSubject(userId, subjectId) {
  const subjects = await getSubjects();
  return subjects.find((subject) => subject.id === subjectId && subject.userId === userId);
}

module.exports = {
  listSubjects,
  createSubject,
  deleteSubject,
  findSubject,
};
