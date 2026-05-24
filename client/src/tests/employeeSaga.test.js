import { runSaga } from 'redux-saga';
import * as actions from '../redux/actions/employeeActions';
import { handleFetchEmployees, handleCreateEmployee } from '../redux/sagas/employeeSaga';

// Factory mock to avoid loading the real employeeService (which imports apiClient with import.meta.env)
jest.mock('../services/employeeService', () => ({
  getEmployees: jest.fn(),
  getEmployee: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

const employeeService = require('../services/employeeService');

const defaultState = {
  employees: {
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
  },
};

async function runSagaWithActions(saga, action, state = defaultState) {
  const dispatched = [];
  await runSaga(
    {
      dispatch: (a) => dispatched.push(a),
      getState: () => state,
    },
    saga,
    action
  ).toPromise();
  return dispatched;
}

describe('employeeSaga — handleFetchEmployees', () => {
  afterEach(() => jest.clearAllMocks());

  it('dispatches fetchEmployeesSuccess on success', async () => {
    const responseData = {
      data: [{ id: 1, firstName: 'Alice', lastName: 'Smith' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    employeeService.getEmployees.mockResolvedValue({ data: responseData });

    const action = actions.fetchEmployeesRequest();
    const dispatched = await runSagaWithActions(handleFetchEmployees, action);

    expect(employeeService.getEmployees).toHaveBeenCalledTimes(1);
    expect(dispatched).toContainEqual(actions.fetchEmployeesSuccess(responseData));
  });

  it('dispatches fetchEmployeesFailure on error', async () => {
    employeeService.getEmployees.mockRejectedValue({
      response: { data: { message: 'Unauthorized' } },
    });

    const action = actions.fetchEmployeesRequest();
    const dispatched = await runSagaWithActions(handleFetchEmployees, action);

    expect(dispatched).toContainEqual(actions.fetchEmployeesFailure('Unauthorized'));
  });

  it('merges payload params with state filters', async () => {
    employeeService.getEmployees.mockResolvedValue({
      data: { data: [], total: 0, page: 2, limit: 20, totalPages: 0 },
    });

    const action = actions.fetchEmployeesRequest({ page: 2 });
    await runSagaWithActions(handleFetchEmployees, action);

    const callArgs = employeeService.getEmployees.mock.calls[0][0];
    expect(callArgs.page).toBe(2);
  });
});

describe('employeeSaga — handleCreateEmployee', () => {
  afterEach(() => jest.clearAllMocks());

  it('dispatches createEmployeeSuccess and re-fetches list on success', async () => {
    employeeService.createEmployee.mockResolvedValue({ data: {} });
    employeeService.getEmployees.mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const action = actions.createEmployeeRequest({ firstName: 'Bob', lastName: 'Jones' });
    const dispatched = await runSagaWithActions(handleCreateEmployee, action);

    expect(dispatched).toContainEqual(actions.createEmployeeSuccess());
    // Should re-fetch after success
    const hasFetchRequest = dispatched.some(
      (a) => a.type === actions.FETCH_EMPLOYEES_REQUEST
    );
    expect(hasFetchRequest).toBe(true);
  });

  it('dispatches createEmployeeFailure on error', async () => {
    employeeService.createEmployee.mockRejectedValue({
      response: { data: { message: 'Duplicate email' } },
    });

    const action = actions.createEmployeeRequest({ firstName: 'Bob' });
    const dispatched = await runSagaWithActions(handleCreateEmployee, action);

    expect(dispatched).toContainEqual(actions.createEmployeeFailure('Duplicate email'));
  });
});
