import { call, put, takeLatest, takeEvery, select, all } from 'redux-saga/effects';
import * as employeeService from '../../services/employeeService';
import {
  FETCH_EMPLOYEES_REQUEST,
  CREATE_EMPLOYEE_REQUEST,
  UPDATE_EMPLOYEE_REQUEST,
  DELETE_EMPLOYEE_REQUEST,
  fetchEmployeesRequest,
  fetchEmployeesSuccess,
  fetchEmployeesFailure,
  fetchEmployeeSuccess,
  fetchEmployeeFailure,
  createEmployeeSuccess,
  createEmployeeFailure,
  updateEmployeeSuccess,
  updateEmployeeFailure,
  deleteEmployeeSuccess,
  deleteEmployeeFailure,
} from '../actions/employeeActions';

const getEmployeeState = (state) => state.employees;

export function* handleFetchEmployees(action) {
  try {
    const employeeState = yield select(getEmployeeState);
    const { filters, page, limit } = employeeState;
    const params = {
      page: action.payload?.page ?? page,
      limit: action.payload?.limit ?? limit,
      ...filters,
      ...action.payload,
    };
    const response = yield call(employeeService.getEmployees, params);
    yield put(fetchEmployeesSuccess(response.data));
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch employees.';
    yield put(fetchEmployeesFailure(message));
  }
}

export function* handleCreateEmployee(action) {
  try {
    yield call(employeeService.createEmployee, action.payload);
    yield put(createEmployeeSuccess());
    yield put(fetchEmployeesRequest());
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create employee.';
    yield put(createEmployeeFailure(message));
  }
}

export function* handleUpdateEmployee(action) {
  try {
    const { id, data } = action.payload;
    yield call(employeeService.updateEmployee, id, data);
    yield put(updateEmployeeSuccess());
    yield put(fetchEmployeesRequest());
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update employee.';
    yield put(updateEmployeeFailure(message));
  }
}

export function* handleDeleteEmployee(action) {
  try {
    yield call(employeeService.deleteEmployee, action.payload);
    yield put(deleteEmployeeSuccess());
    yield put(fetchEmployeesRequest());
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete employee.';
    yield put(deleteEmployeeFailure(message));
  }
}

function* watchFetchEmployees() {
  yield takeLatest(FETCH_EMPLOYEES_REQUEST, handleFetchEmployees);
}

function* watchCreateEmployee() {
  yield takeEvery(CREATE_EMPLOYEE_REQUEST, handleCreateEmployee);
}

function* watchUpdateEmployee() {
  yield takeEvery(UPDATE_EMPLOYEE_REQUEST, handleUpdateEmployee);
}

function* watchDeleteEmployee() {
  yield takeEvery(DELETE_EMPLOYEE_REQUEST, handleDeleteEmployee);
}

export function* employeeSaga() {
  yield all([
    watchFetchEmployees(),
    watchCreateEmployee(),
    watchUpdateEmployee(),
    watchDeleteEmployee(),
  ]);
}
