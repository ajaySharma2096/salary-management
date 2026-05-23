'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');
const { sequelize, User, Employee } = require('../models');

let authCookie;

const validEmployee = {
  firstName: 'Alice',
  lastName: 'Smith',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'USA',
  salary: 95000,
  hireDate: '2022-06-01',
  employmentType: 'full_time',
};

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Create and login a user to get auth cookie
  await User.create({
    email: 'hr@test.com',
    password: 'Password1!',
    firstName: 'HR',
    lastName: 'Manager',
    role: 'hr_manager',
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hr@test.com', password: 'Password1!' });

  authCookie = loginRes.headers['set-cookie'];
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await Employee.destroy({ where: {}, truncate: true });
});

describe('GET /api/employees (unauthenticated)', () => {
  test('returns 401 without auth cookie', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/employees', () => {
  test('creates employee with valid data → 201', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Cookie', authCookie)
      .send(validEmployee);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.firstName).toBe('Alice');
    expect(res.body.fullName).toBe('Alice Smith');
  });

  test('returns 422 when firstName is missing', async () => {
    const { firstName, ...rest } = validEmployee;
    const res = await request(app)
      .post('/api/employees')
      .set('Cookie', authCookie)
      .send(rest);
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('returns 422 with invalid email format', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Cookie', authCookie)
      .send({ ...validEmployee, email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  test('returns 422 with negative salary', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Cookie', authCookie)
      .send({ ...validEmployee, salary: -1000 });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/employees', () => {
  beforeEach(async () => {
    await Employee.bulkCreate([
      { ...validEmployee, firstName: 'Alice', lastName: 'Alpha', email: 'alice@test.com' },
      { ...validEmployee, firstName: 'Bob', lastName: 'Beta', email: 'bob@test.com', country: 'UK' },
      { ...validEmployee, firstName: 'Carol', lastName: 'Gamma', email: 'carol@test.com', country: 'UK' },
    ]);
  });

  test('returns paginated result with correct structure', async () => {
    const res = await request(app)
      .get('/api/employees?page=1&limit=2')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total', 3);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 2);
    expect(res.body).toHaveProperty('totalPages', 2);
    expect(res.body.data.length).toBe(2);
  });

  test('filters by search param', async () => {
    const res = await request(app)
      .get('/api/employees?search=Alice')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].firstName).toBe('Alice');
  });

  test('filters by country param', async () => {
    const res = await request(app)
      .get('/api/employees?country=UK')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });
});

describe('GET /api/employees/:id', () => {
  test('returns employee by id', async () => {
    const emp = await Employee.create(validEmployee);
    const res = await request(app)
      .get(`/api/employees/${emp.id}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(emp.id);
    expect(res.body.fullName).toBe('Alice Smith');
  });

  test('returns 404 for non-existent id', async () => {
    const res = await request(app)
      .get('/api/employees/99999')
      .set('Cookie', authCookie);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/employees/:id', () => {
  test('updates employee and returns updated data', async () => {
    const emp = await Employee.create(validEmployee);
    const res = await request(app)
      .put(`/api/employees/${emp.id}`)
      .set('Cookie', authCookie)
      .send({ jobTitle: 'Senior Engineer', salary: 120000 });
    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe('Senior Engineer');
    expect(parseFloat(res.body.salary)).toBe(120000);
  });
});

describe('DELETE /api/employees/:id', () => {
  test('deletes employee → 200 and employee no longer fetchable', async () => {
    const emp = await Employee.create(validEmployee);
    const delRes = await request(app)
      .delete(`/api/employees/${emp.id}`)
      .set('Cookie', authCookie);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toBe('Employee deleted successfully');

    const getRes = await request(app)
      .get(`/api/employees/${emp.id}`)
      .set('Cookie', authCookie);
    expect(getRes.status).toBe(404);
  });
});
