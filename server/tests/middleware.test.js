'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { sequelize, User } = require('../models');
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAuthorized = require('../middlewares/isAuthorized');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    email: 'mw@test.com',
    password: 'Password1!',
    firstName: 'MW',
    lastName: 'Test',
    role: 'hr_manager',
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── Helper to create mock res object ────────────────────────────────────────

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn(),
  };
  return res;
}

// ─── isAuthenticated middleware ───────────────────────────────────────────────

describe('isAuthenticated middleware', () => {
  test('returns 401 when no token cookie is present', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('returns 401 with "Session expired" when JWT is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: 'mw@test.com', role: 'hr_manager' },
      process.env.JWT_SECRET,
      { expiresIn: 0 }   // expires immediately
    );
    // Small delay so the token is definitely expired
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/[Ss]ession expired/);
  });

  test('attaches req.user and calls next() with a valid JWT', () => {
    const token = jwt.sign(
      { userId: 1, email: 'mw@test.com', role: 'hr_manager' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = { cookies: { token } };
    const res = makeRes();
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('hr_manager');
    expect(req.user.email).toBe('mw@test.com');
  });
});

// ─── isAuthorized middleware ──────────────────────────────────────────────────

describe('isAuthorized middleware', () => {
  const mockHrUser = { userId: 1, email: 'mw@test.com', role: 'hr_manager' };

  test('returns 403 when user role is not in allowed roles', () => {
    const req = { user: mockHrUser };
    const res = makeRes();
    const next = jest.fn();

    isAuthorized('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Forbidden') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when user role is in allowed roles', () => {
    const req = { user: mockHrUser };
    const res = makeRes();
    const next = jest.fn();

    isAuthorized('hr_manager')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('allows access when role matches any of multiple allowed roles', () => {
    const req = { user: mockHrUser };
    const res = makeRes();
    const next = jest.fn();

    isAuthorized('admin', 'hr_manager')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ─── validate middleware (exercised via API) ──────────────────────────────────

describe('validate middleware', () => {
  test('returns 422 with structured errors array when validation fails', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: 'weak' });

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.errors[0]).toHaveProperty('msg');
  });

  test('does not return 422 when validation passes', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'valid@example.com',
        password: 'Strong@123',
        firstName: 'Alice',
        lastName: 'Test',
      });
    // 201 created or 409 duplicate — not 422
    expect(res.status).not.toBe(422);
  });
});
