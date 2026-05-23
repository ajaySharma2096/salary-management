'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Employee = require('./Employee');

// User and Employee are standalone — no FK associations between them

module.exports = {
  sequelize,
  User,
  Employee,
};
