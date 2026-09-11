const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');

const testDataDir = path.join('/tmp', `benkyo-test-data-${process.pid}`);
process.env.DATA_DIR = testDataDir;
process.env.FRONTEND_ORIGIN = 'http://localhost:5500';

const app = require('../app');

async function resetData() {
  await fs.mkdir(testDataDir, { recursive: true });
  const files = ['users.json', 'tokens.json', 'sessions.json', 'subjects.json', 'settings.json'];
  await Promise.all(files.map((name) => fs.writeFile(path.join(testDataDir, name), '[]')));
}

async function registerAndLogin({ username, email, password }) {
  await request(app).post('/api/auth/register').send({ username, email, password }).expect(201);
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ identifier: email, password })
    .expect(200);

  return loginResponse.body.token;
}

test.beforeEach(async () => {
  await resetData();
});

test('register hashes password and me does not return password', async () => {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ username: 'sam', email: 'sam@example.com', password: 'secret123' })
    .expect(201);

  assert.equal(registerRes.body.user.username, 'sam');

  const usersRaw = await fs.readFile(path.join(testDataDir, 'users.json'), 'utf-8');
  const users = JSON.parse(usersRaw);
  assert.equal(users.length, 1);
  assert.notEqual(users[0].password, 'secret123');

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'sam@example.com', password: 'secret123' })
    .expect(200);

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer ' + loginRes.body.token)
    .expect(200);

  assert.equal(typeof meRes.body.user.password, 'undefined');
});

test('protected routes require valid token and logout invalidates token', async () => {
  const token = await registerAndLogin({
    username: 'ravi',
    email: 'ravi@example.com',
    password: 'secret123',
  });

  await request(app).get('/api/sessions').set('Authorization', 'Bearer ' + token).expect(200);

  await request(app).post('/api/auth/logout').set('Authorization', 'Bearer ' + token).expect(200);

  await request(app).get('/api/sessions').set('Authorization', 'Bearer ' + token).expect(401);
});

test('completed sessions affect streak/activity and stopped sessions are rejected', async () => {
  const token = await registerAndLogin({
    username: 'ana',
    email: 'ana@example.com',
    password: 'secret123',
  });

  const auth = { Authorization: 'Bearer ' + token };

  await request(app)
    .post('/api/sessions')
    .set(auth)
    .send({ subjectName: 'Programming', durationMinutes: 25, status: 'stopped' })
    .expect(400);

  await request(app)
    .post('/api/sessions')
    .set(auth)
    .send({
      subjectName: 'Programming',
      durationMinutes: 30,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    .expect(201);

  const stats = await request(app).get('/api/stats').set(auth).expect(200);
  assert.equal(stats.body.completedSessions, 1);
  assert.equal(stats.body.currentStreak, 1);
  assert.equal(stats.body.totalFocusMinutes, 30);

  const activity = await request(app).get('/api/stats/activity').set(auth).expect(200);
  assert.equal(activity.body.activity.length, 1);
  assert.equal(activity.body.activity[0].level, 2);
});
