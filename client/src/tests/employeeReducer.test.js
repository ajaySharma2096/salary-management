import employeeReducer from '../redux/reducers/employeeReducer';
import * as actions from '../redux/actions/employeeActions';

describe('employeeReducer', () => {
  const initialState = {
    list: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    filters: {
      search: '',
      country: '',
      department: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    },
    currentEmployee: null,
    loading: false,
    submitting: false,
    error: null,
  };

  it('returns initial state for unknown action', () => {
    expect(employeeReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets loading=true on FETCH_EMPLOYEES_REQUEST', () => {
    const state = employeeReducer(initialState, actions.fetchEmployeesRequest());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('updates list and pagination on FETCH_EMPLOYEES_SUCCESS', () => {
    const payload = {
      data: [{ id: 1, firstName: 'Alice', lastName: 'Smith' }],
      total: 100,
      page: 2,
      limit: 20,
      totalPages: 5,
    };
    const state = employeeReducer(initialState, actions.fetchEmployeesSuccess(payload));
    expect(state.loading).toBe(false);
    expect(state.list).toEqual(payload.data);
    expect(state.total).toBe(100);
    expect(state.page).toBe(2);
    expect(state.totalPages).toBe(5);
  });

  it('sets error on FETCH_EMPLOYEES_FAILURE', () => {
    const state = employeeReducer(initialState, actions.fetchEmployeesFailure('Server error'));
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Server error');
  });

  it('sets submitting=true on CREATE_EMPLOYEE_REQUEST', () => {
    const state = employeeReducer(initialState, actions.createEmployeeRequest({ firstName: 'A' }));
    expect(state.submitting).toBe(true);
    expect(state.error).toBeNull();
  });

  it('clears submitting on CREATE_EMPLOYEE_SUCCESS', () => {
    const withSubmitting = { ...initialState, submitting: true };
    const state = employeeReducer(withSubmitting, actions.createEmployeeSuccess());
    expect(state.submitting).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error on CREATE_EMPLOYEE_FAILURE', () => {
    const state = employeeReducer(initialState, actions.createEmployeeFailure('Duplicate email'));
    expect(state.submitting).toBe(false);
    expect(state.error).toBe('Duplicate email');
  });

  it('updates filters and resets page on SET_EMPLOYEE_FILTERS', () => {
    const prevState = { ...initialState, page: 3 };
    const state = employeeReducer(prevState, actions.setEmployeeFilters({ country: 'India', search: 'Alice' }));
    expect(state.filters.country).toBe('India');
    expect(state.filters.search).toBe('Alice');
    expect(state.page).toBe(1);
  });

  it('preserves existing filters when partially updating', () => {
    const prevState = {
      ...initialState,
      filters: { ...initialState.filters, country: 'Germany', department: 'Engineering' },
    };
    const state = employeeReducer(prevState, actions.setEmployeeFilters({ department: 'Finance' }));
    expect(state.filters.country).toBe('Germany');
    expect(state.filters.department).toBe('Finance');
  });

  it('sets submitting=true on DELETE_EMPLOYEE_REQUEST', () => {
    const state = employeeReducer(initialState, actions.deleteEmployeeRequest(42));
    expect(state.submitting).toBe(true);
  });

  it('clears submitting on DELETE_EMPLOYEE_SUCCESS', () => {
    const withSubmitting = { ...initialState, submitting: true };
    const state = employeeReducer(withSubmitting, actions.deleteEmployeeSuccess());
    expect(state.submitting).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clears error on CLEAR_EMPLOYEE_ERROR', () => {
    const withError = { ...initialState, error: 'some error' };
    const state = employeeReducer(withError, actions.clearEmployeeError());
    expect(state.error).toBeNull();
  });

  it('sets submitting=true on UPDATE_EMPLOYEE_REQUEST', () => {
    const state = employeeReducer(initialState, actions.updateEmployeeRequest(1, { firstName: 'Bob' }));
    expect(state.submitting).toBe(true);
  });

  it('clears submitting on UPDATE_EMPLOYEE_SUCCESS', () => {
    const withSubmitting = { ...initialState, submitting: true };
    const state = employeeReducer(withSubmitting, actions.updateEmployeeSuccess());
    expect(state.submitting).toBe(false);
  });
});
