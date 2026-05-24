import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authReducer';
import employeeReducer from './employeeReducer';
import analyticsReducer from './analyticsReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  employees: employeeReducer,
  analytics: analyticsReducer,
});

export default rootReducer;
