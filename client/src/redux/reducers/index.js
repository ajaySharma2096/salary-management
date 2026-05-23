import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authReducer';
import employeeReducer from './employeeReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  employees: employeeReducer,
});

export default rootReducer;
