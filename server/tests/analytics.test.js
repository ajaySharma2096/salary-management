'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');
const { sequelize, User, Employee } = require('../models');

let authCookie;

// Five employees with known salaries across two countries and departments
const testEmployees = [
  {
    firstName: 'Alice', lastName: 'A', jobTitle: 'Engineer', department: 'Engineering',
    country: 'USA', salary: 100000, hireDate: '2020-01-01', employmentType: 'full_time', status: 'active',
  },
  {
    firstName: 'Bob', lastName: 'B', jobTitle: 'Engineer', department: 'Engineering',
    country: 'USA', salary: 120000, hireDate: '2020-02-01', employmentType: 'full_time', status: 'active',
  },
  {
    firstName: 'Carol', lastName: 'C', jobTitle: 'Designer', department: 'Design',
    country: 'USA', salary: 80000, hireDate: '2020-03-01', employmentType: 'full_time', status: 'inactive',
  },
  {
    firstName: 'Dave', lastName: 'D', jobTitle: 'Analyst', department: 'Finance',
    country: 'UK', salary: 70000, hireDate: '2021-01-01', employmentType: 'full_time', status: 'active',
  },
  {
    firstName: 'Eve', lastName: 'E', jobTitle: 'Analyst', department: 'Finance',
    country: 'UK', salary: 90000, hireDate: '2021-06-01', employmentType: 'full_time', status: 'active',
  },
];

beforeAll(async () => {
  await sequelize.sync({ force: true });

  await User.create({
    email: 'analytics@test.com',
    password: 'Password1!',
    firstName: 'Test',
    lastName: 'User',
    role: 'hr_manager',
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'analytics@test.com', password: 'Password1!' });
  authCookie = loginRes.headers['set-cookie'];

  await Employee.bulkCreate(testEmployees);
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/analytics/salary-by-country', () => {
  test('returns aggregated salary data per country', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-country')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const usa = res.body.find((r) => r.country === 'USA');
    expect(usa).toBeDefined();
    expect(usa.minSalary).toBe(80000);
    expect(usa.maxSalary).toBe(120000);
    expect(parseFloat(usa.avgSalary)).toBeCloseTo(100000, 0);
    expect(usa.employeeCount).toBe(3);
    // median of [80000, 100000, 120000] = 100000
    expect(usa.medianSalary).toBe(100000);

    const uk = res.body.find((r) => r.country === 'UK');
    expect(uk).toBeDefined();
    expect(uk.minSalary).toBe(70000);
    expect(uk.maxSalary).toBe(90000);
    // median of [70000, 90000] = 80000
    expect(uk.medianSalary).toBe(80000);
  });

  test('filters by country query param', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-country?country=UK')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].country).toBe('UK');
  });
});

describe('GET /api/analytics/salary-by-job-title', () => {
  test('returns job title breakdown for a given country', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-job-title?country=USA')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const engineer = res.body.find((r) => r.jobTitle === 'Engineer');
    expect(engineer).toBeDefined();
    expect(engineer.country).toBe('USA');
    expect(engineer.minSalary).toBe(100000);
    expect(engineer.maxSalary).toBe(120000);
    expect(engineer.employeeCount).toBe(2);
  });

  test('returns 422 when country param is missing', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-job-title')
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
  });
});

describe('GET /api/analytics/salary-distribution', () => {
  test('returns salary brackets with correct counts', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-distribution')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // 5 employees: 70k, 80k, 90k, 100k, 120k
    // 60000-100000: 70k, 80k, 90k → count 3
    // 100000-150000: 100k, 120k → count 2
    const bucket60_100 = res.body.find((b) => b.range === '60000-100000');
    expect(bucket60_100.count).toBe(3);
    const bucket100_150 = res.body.find((b) => b.range === '100000-150000');
    expect(bucket100_150.count).toBe(2);

    const total = res.body.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(5);
  });
});

describe('GET /api/analytics/top-earners', () => {
  test('returns employees sorted by salary DESC', async () => {
    const res = await request(app)
      .get('/api/analytics/top-earners?limit=3')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body[0].salary).toBeGreaterThanOrEqual(res.body[1].salary);
    expect(res.body[1].salary).toBeGreaterThanOrEqual(res.body[2].salary);
    expect(res.body[0]).toHaveProperty('fullName');
  });
});

describe('GET /api/analytics/department-summary', () => {
  test('returns department totals for active employees only', async () => {
    const res = await request(app)
      .get('/api/analytics/department-summary')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Carol (Designer/inactive) should NOT be included
    const design = res.body.find((r) => r.department === 'Design');
    expect(design).toBeUndefined();

    // Engineering: Alice(100k) + Bob(120k) = 220k total payroll
    const eng = res.body.find((r) => r.department === 'Engineering');
    expect(eng).toBeDefined();
    expect(eng.employeeCount).toBe(2);
    expect(parseFloat(eng.totalPayroll)).toBeCloseTo(220000, 0);
  });
});

// ─── Extended edge-case tests (Subtask 10) ───────────────────────────────────

describe('Median salary — even vs odd employee counts', () => {
  test('median of even number of employees (UK: 2 employees → 80000)', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-country?country=UK')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    const uk = res.body[0];
    // Even: [70000, 90000] → (70000 + 90000) / 2 = 80000
    expect(uk.employeeCount).toBe(2);
    expect(uk.medianSalary).toBe(80000);
  });

  test('median of odd number of employees (USA: 3 employees → 100000)', async () => {
    const res = await request(app)
      .get('/api/analytics/salary-by-country?country=USA')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    const usa = res.body[0];
    // Odd: [80000, 100000, 120000] → middle value = 100000
    expect(usa.employeeCount).toBe(3);
    expect(usa.medianSalary).toBe(100000);
  });
});

describe('Department summary — mixed active/inactive employees', () => {
  test('total active employee count across all departments equals 4', async () => {
    const res = await request(app)
      .get('/api/analytics/department-summary')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    // Active employees: Alice, Bob (Engineering), Dave, Eve (Finance) = 4
    // Carol is inactive → excluded
    const totalActive = res.body.reduce((sum, d) => sum + Number(d.employeeCount), 0);
    expect(totalActive).toBe(4);
  });

  test('inactive employees department does not appear in department summary', async () => {
    const res = await request(app)
      .get('/api/analytics/department-summary')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    // Carol is the only employee in 'Design' and she is inactive
    const design = res.body.find((d) => d.department === 'Design');
    expect(design).toBeUndefined();
  });
});
