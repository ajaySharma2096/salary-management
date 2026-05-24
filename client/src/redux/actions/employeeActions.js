// Action Types
export const FETCH_EMPLOYEES_REQUEST = 'FETCH_EMPLOYEES_REQUEST';
export const FETCH_EMPLOYEES_SUCCESS = 'FETCH_EMPLOYEES_SUCCESS';
export const FETCH_EMPLOYEES_FAILURE = 'FETCH_EMPLOYEES_FAILURE';

export const FETCH_EMPLOYEE_REQUEST = 'FETCH_EMPLOYEE_REQUEST';
export const FETCH_EMPLOYEE_SUCCESS = 'FETCH_EMPLOYEE_SUCCESS';
export const FETCH_EMPLOYEE_FAILURE = 'FETCH_EMPLOYEE_FAILURE';

export const CREATE_EMPLOYEE_REQUEST = 'CREATE_EMPLOYEE_REQUEST';
export const CREATE_EMPLOYEE_SUCCESS = 'CREATE_EMPLOYEE_SUCCESS';
export const CREATE_EMPLOYEE_FAILURE = 'CREATE_EMPLOYEE_FAILURE';

export const UPDATE_EMPLOYEE_REQUEST = 'UPDATE_EMPLOYEE_REQUEST';
export const UPDATE_EMPLOYEE_SUCCESS = 'UPDATE_EMPLOYEE_SUCCESS';
export const UPDATE_EMPLOYEE_FAILURE = 'UPDATE_EMPLOYEE_FAILURE';

export const DELETE_EMPLOYEE_REQUEST = 'DELETE_EMPLOYEE_REQUEST';
export const DELETE_EMPLOYEE_SUCCESS = 'DELETE_EMPLOYEE_SUCCESS';
export const DELETE_EMPLOYEE_FAILURE = 'DELETE_EMPLOYEE_FAILURE';

export const SET_EMPLOYEE_FILTERS = 'SET_EMPLOYEE_FILTERS';
export const CLEAR_EMPLOYEE_ERROR = 'CLEAR_EMPLOYEE_ERROR';

// Action Creators
export const fetchEmployeesRequest = (params) => ({
  type: FETCH_EMPLOYEES_REQUEST,
  payload: params,
});

export const fetchEmployeesSuccess = (data) => ({
  type: FETCH_EMPLOYEES_SUCCESS,
  payload: data,
});

export const fetchEmployeesFailure = (error) => ({
  type: FETCH_EMPLOYEES_FAILURE,
  payload: error,
});

export const fetchEmployeeRequest = (id) => ({
  type: FETCH_EMPLOYEE_REQUEST,
  payload: id,
});

export const fetchEmployeeSuccess = (employee) => ({
  type: FETCH_EMPLOYEE_SUCCESS,
  payload: employee,
});

export const fetchEmployeeFailure = (error) => ({
  type: FETCH_EMPLOYEE_FAILURE,
  payload: error,
});

export const createEmployeeRequest = (data) => ({
  type: CREATE_EMPLOYEE_REQUEST,
  payload: data,
});

export const createEmployeeSuccess = () => ({
  type: CREATE_EMPLOYEE_SUCCESS,
});

export const createEmployeeFailure = (error) => ({
  type: CREATE_EMPLOYEE_FAILURE,
  payload: error,
});

export const updateEmployeeRequest = (id, data) => ({
  type: UPDATE_EMPLOYEE_REQUEST,
  payload: { id, data },
});

export const updateEmployeeSuccess = () => ({
  type: UPDATE_EMPLOYEE_SUCCESS,
});

export const updateEmployeeFailure = (error) => ({
  type: UPDATE_EMPLOYEE_FAILURE,
  payload: error,
});

export const deleteEmployeeRequest = (id) => ({
  type: DELETE_EMPLOYEE_REQUEST,
  payload: id,
});

export const deleteEmployeeSuccess = () => ({
  type: DELETE_EMPLOYEE_SUCCESS,
});

export const deleteEmployeeFailure = (error) => ({
  type: DELETE_EMPLOYEE_FAILURE,
  payload: error,
});

export const setEmployeeFilters = (filters) => ({
  type: SET_EMPLOYEE_FILTERS,
  payload: filters,
});

export const clearEmployeeError = () => ({
  type: CLEAR_EMPLOYEE_ERROR,
});
