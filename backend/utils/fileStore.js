const fs = require('fs/promises');
const path = require('path');

async function ensureFile(filePath, defaultData = []) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
  }
}

async function readData(filePath, defaultData = []) {
  await ensureFile(filePath, defaultData);
  const file = await fs.readFile(filePath, 'utf-8');

  if (!file.trim()) {
    return defaultData;
  }

  try {
    return JSON.parse(file);
  } catch {
    return defaultData;
  }
}

async function writeData(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };
