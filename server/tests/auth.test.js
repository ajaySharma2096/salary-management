'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

const validUser = {
  email: 'hr@example.com',
  password: 'Password1!',
  firstName: 'Jane',
  lastName: 'Doe',
};

describe('POST /api/auth/signup', () => {
  test('returns 201 with valid data', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created successfully');
  });

  test('returns 409 with duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.status).toBe(409);
  });

  test('returns 422 with weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validUser, password: 'weak' });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('returns 422 when firstName is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: validUser.email, password: validUser.password, lastName: 'Doe' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(validUser);
  });

  test('returns 200 and sets cookie with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.user).toHaveProperty('email', validUser.email);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('token='))).toBe(true);
  });

  test('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('returns 401 with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: validUser.password });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 200 with valid cookie', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers['set-cookie'];
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', validUser.email);
  });
});

describe('POST /api/auth/logout', () => {
  test('returns 200 and clears cookie', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers['set-cookie'];
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');

    const cookies = res.headers['set-cookie'];
    const tokenCookie = cookies && cookies.find((c) => c.startsWith('token='));
    // Cookie should be cleared (empty value or expires in the past)
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/token=;|token=(?:;|$)/);
  });
});
