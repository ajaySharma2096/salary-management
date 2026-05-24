'use strict';

process.env.NODE_ENV = 'test';

const { sequelize, User, Employee } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Employee model', () => {
  test('has expected fields defined', () => {
    const attrs = Employee.rawAttributes;
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('firstName');
    expect(attrs).toHaveProperty('lastName');
    expect(attrs).toHaveProperty('email');
    expect(attrs).toHaveProperty('phone');
    expect(attrs).toHaveProperty('jobTitle');
    expect(attrs).toHaveProperty('department');
    expect(attrs).toHaveProperty('country');
    expect(attrs).toHaveProperty('city');
    expect(attrs).toHaveProperty('salary');
    expect(attrs).toHaveProperty('currency');
    expect(attrs).toHaveProperty('employmentType');
    expect(attrs).toHaveProperty('status');
    expect(attrs).toHaveProperty('hireDate');
  });

  test('fullName virtual getter returns correct value', async () => {
    const employee = await Employee.create({
      firstName: 'Jane',
      lastName: 'Doe',
      jobTitle: 'Engineer',
      department: 'Engineering',
      country: 'USA',
      salary: 80000,
      hireDate: '2023-01-15',
    });

    expect(employee.fullName).toBe('Jane Doe');
  });

  test('fullName is not a stored column', () => {
    const attr = Employee.rawAttributes.fullName;
    expect(attr.type.key).toBe('VIRTUAL');
  });
});

describe('User model', () => {
  test('validatePassword returns true for correct password', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'PlainPassword1!',
      firstName: 'Test',
      lastName: 'User',
      role: 'hr_manager',
    });

    const isValid = await user.validatePassword('PlainPassword1!');
    expect(isValid).toBe(true);
  });

  test('validatePassword returns false for wrong password', async () => {
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    const isValid = await user.validatePassword('WrongPassword99!');
    expect(isValid).toBe(false);
  });

  test('password is stored hashed (not plain text)', async () => {
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    expect(user.password).not.toBe('PlainPassword1!');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });
});
