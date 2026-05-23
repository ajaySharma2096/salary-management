'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const { sequelize, Employee, User } = require('../models');

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Data Analyst',
  'HR Specialist', 'Financial Analyst', 'Marketing Manager', 'Sales Representative',
  'DevOps Engineer', 'UX Designer', 'Business Analyst', 'QA Engineer',
  'Project Manager', 'Data Scientist', 'Backend Developer', 'Frontend Developer',
  'Full Stack Developer', 'Security Engineer', 'Cloud Architect', 'Customer Success Manager',
  'Operations Manager', 'Legal Counsel', 'Recruiter', 'Accountant',
  'Content Writer', 'Graphic Designer', 'Technical Lead', 'Engineering Manager',
  'VP of Engineering', 'Chief Technology Officer',
];

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'HR', 'Finance', 'Marketing',
  'Sales', 'Operations', 'Legal', 'Customer Success', 'Data', 'Security',
];

// Weighted country pool (total weight = 100)
const COUNTRY_WEIGHTS = [
  { country: 'India',       weight: 25, currency: 'INR', cities: ['Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Delhi'] },
  { country: 'USA',         weight: 25, currency: 'USD', cities: ['New York', 'San Francisco', 'Austin', 'Seattle', 'Chicago', 'Boston'] },
  { country: 'UK',          weight: 10, currency: 'GBP', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol'] },
  { country: 'Germany',     weight: 8,  currency: 'EUR', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { country: 'Canada',      weight: 7,  currency: 'CAD', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
  { country: 'Australia',   weight: 5,  currency: 'AUD', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { country: 'Singapore',   weight: 4,  currency: 'USD', cities: ['Singapore'] },
  { country: 'UAE',         weight: 3,  currency: 'AED', cities: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
  { country: 'France',      weight: 3,  currency: 'EUR', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse'] },
  { country: 'Brazil',      weight: 3,  currency: 'BRL', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Curitiba'] },
  { country: 'Netherlands', weight: 2,  currency: 'EUR', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'] },
  { country: 'Sweden',      weight: 1,  currency: 'SEK', cities: ['Stockholm', 'Gothenburg', 'Malmö'] },
  { country: 'Japan',       weight: 1,  currency: 'JPY', cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya'] },
  { country: 'South Korea', weight: 1,  currency: 'KRW', cities: ['Seoul', 'Busan', 'Incheon'] },
  { country: 'Mexico',      weight: 1,  currency: 'MXN', cities: ['Mexico City', 'Guadalajara', 'Monterrey'] },
  { country: 'Argentina',   weight: 1,  currency: 'ARS', cities: ['Buenos Aires', 'Córdoba', 'Rosario'] },
  { country: 'South Africa',weight: 1,  currency: 'ZAR', cities: ['Johannesburg', 'Cape Town', 'Durban'] },
  { country: 'Nigeria',     weight: 1,  currency: 'NGN', cities: ['Lagos', 'Abuja', 'Port Harcourt'] },
  { country: 'Poland',      weight: 1,  currency: 'PLN', cities: ['Warsaw', 'Kraków', 'Wrocław'] },
  { country: 'Spain',       weight: 1,  currency: 'EUR', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville'] },
];

// Build a cumulative weight array for O(log n) selection
const COUNTRY_CUMULATIVE = (() => {
  let cum = 0;
  return COUNTRY_WEIGHTS.map((c) => ({ ...c, cum: (cum += c.weight) }));
})();
const TOTAL_WEIGHT = COUNTRY_CUMULATIVE[COUNTRY_CUMULATIVE.length - 1].cum;

// Salary ranges per job title category (in USD-equivalent)
const SALARY_RANGES = {
  junior: { min: 30000, max: 70000 },
  mid:    { min: 60000, max: 120000 },
  senior: { min: 100000, max: 200000 },
};

const JOB_TITLE_TIERS = {
  'Software Engineer':         'junior',
  'Data Analyst':              'junior',
  'HR Specialist':             'junior',
  'Sales Representative':      'junior',
  'QA Engineer':               'junior',
  'Content Writer':            'junior',
  'Graphic Designer':          'junior',
  'Recruiter':                 'junior',
  'Accountant':                'junior',
  'Financial Analyst':         'mid',
  'Marketing Manager':         'mid',
  'DevOps Engineer':           'mid',
  'UX Designer':               'mid',
  'Business Analyst':          'mid',
  'Backend Developer':         'mid',
  'Frontend Developer':        'mid',
  'Full Stack Developer':      'mid',
  'Security Engineer':         'mid',
  'Data Scientist':            'mid',
  'Customer Success Manager':  'mid',
  'Operations Manager':        'mid',
  'Legal Counsel':             'mid',
  'Senior Software Engineer':  'senior',
  'Technical Lead':            'senior',
  'Product Manager':           'senior',
  'Project Manager':           'senior',
  'Cloud Architect':           'senior',
  'Engineering Manager':       'senior',
  'VP of Engineering':         'senior',
  'Chief Technology Officer':  'senior',
};

// Country purchasing-power multipliers (relative to USD base)
const COUNTRY_PPP = {
  'India': 0.35, 'Brazil': 0.45, 'Mexico': 0.45, 'South Africa': 0.4,
  'Nigeria': 0.3, 'Argentina': 0.35, 'Poland': 0.6, 'South Korea': 0.75,
  'Japan': 0.8, 'Spain': 0.75, 'France': 0.85, 'Germany': 0.9,
  'Netherlands': 0.95, 'Sweden': 0.95, 'Canada': 0.92, 'Australia': 0.9,
  'UK': 0.88, 'UAE': 0.85, 'Singapore': 1.1, 'USA': 1.0,
};

const EMPLOYMENT_TYPES = [
  ...Array(80).fill('full_time'),
  ...Array(10).fill('part_time'),
  ...Array(7).fill('contract'),
  ...Array(3).fill('intern'),
];

const STATUSES = [
  ...Array(90).fill('active'),
  ...Array(5).fill('inactive'),
  ...Array(5).fill('on_leave'),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickCountry() {
  const r = Math.random() * TOTAL_WEIGHT;
  return COUNTRY_CUMULATIVE.find((c) => r < c.cum);
}

function randomHireDate() {
  const start = new Date('2015-01-01').getTime();
  const end   = new Date('2024-12-31').getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

function generateSalary(jobTitle, country) {
  const tier = JOB_TITLE_TIERS[jobTitle] || 'mid';
  const range = SALARY_RANGES[tier];
  const ppp = COUNTRY_PPP[country] || 0.7;
  const base = randInt(range.min, range.max);
  return Math.round(base * ppp * 100) / 100;
}

// ---------------------------------------------------------------------------
// Core generator — exported for unit tests
// ---------------------------------------------------------------------------

function generateEmployees(n, firstNames, lastNames) {
  // If names not provided (unit test context), use fallback pools
  const fNames = firstNames && firstNames.length ? firstNames : ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];
  const lNames = lastNames && lastNames.length  ? lastNames  : ['Smith', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Lee'];

  const usedEmails = new Set();
  const records = [];

  for (let i = 0; i < n; i++) {
    const firstName = rand(fNames);
    const lastName  = rand(lNames);
    const country   = pickCountry();
    const jobTitle  = rand(JOB_TITLES);

    // Generate a unique email
    let email;
    let attempts = 0;
    do {
      const suffix = randInt(1, 99999);
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@company.com`;
      attempts++;
    } while (usedEmails.has(email) && attempts < 20);
    usedEmails.add(email);

    const areaCode  = randInt(200, 999);
    const part1     = randInt(100, 999);
    const part2     = randInt(1000, 9999);
    const phone     = `+1-${areaCode}-${part1}-${part2}`;

    records.push({
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department:     rand(DEPARTMENTS),
      country:        country.country,
      city:           rand(country.cities),
      salary:         generateSalary(jobTitle, country.country),
      currency:       country.currency,
      employmentType: rand(EMPLOYMENT_TYPES),
      status:         rand(STATUSES),
      hireDate:       randomHireDate(),
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  try {
    // Read name files from workspace root
    const firstNamesPath = path.join(__dirname, '../../first_names.txt');
    const lastNamesPath  = path.join(__dirname, '../../last_names.txt');

    const firstNames = fs.readFileSync(firstNamesPath, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
    const lastNames  = fs.readFileSync(lastNamesPath,  'utf8').split('\n').map((s) => s.trim()).filter(Boolean);

    console.log(`Loaded ${firstNames.length} first names, ${lastNames.length} last names.`);

    // Idempotency check
    const count = await Employee.count();
    if (count >= 10000) {
      console.log('Database already seeded, skipping.');
      await sequelize.close();
      process.exit(0);
    }

    // Seed default admin user
    const [adminUser, created] = await User.findOrCreate({
      where: { email: 'admin@company.com' },
      defaults: {
        password:  'Admin@123456',
        firstName: 'Admin',
        lastName:  'User',
        role:      'hr_manager',
      },
    });
    console.log(created ? 'Admin user created.' : 'Admin user already exists.');

    // Generate and insert employees in chunks of 500
    const TOTAL  = 10000;
    const CHUNK  = 500;
    const records = generateEmployees(TOTAL, firstNames, lastNames);

    let inserted = 0;
    const chunks = Math.ceil(TOTAL / CHUNK);

    for (let i = 0; i < chunks; i++) {
      const slice = records.slice(i * CHUNK, (i + 1) * CHUNK);
      await Employee.bulkCreate(slice, { validate: false, ignoreDuplicates: true, logging: false });
      inserted += slice.length;
      console.log(`Inserted chunk ${i + 1}/${chunks} (${inserted} records so far)`);
    }

    console.log(`Seeding complete. ${inserted} employees inserted.`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

// Run when executed directly
if (require.main === module) {
  seed();
}

module.exports = { generateEmployees };
