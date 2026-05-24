import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EmployeeFormModal from '../components/EmployeeFormModal';
import employeeReducer from '../redux/reducers/employeeReducer';

// Mock Ant Design's static message API to prevent DOM container errors
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const defaultEmployeesState = {
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

function createStore(employeesOverrides = {}) {
  return configureStore({
    reducer: { employees: employeeReducer },
    preloadedState: {
      employees: { ...defaultEmployeesState, ...employeesOverrides },
    },
  });
}

function renderModal({ employee = null, open = true, store } = {}) {
  const s = store || createStore();
  const onClose = jest.fn();
  render(
    <Provider store={s}>
      <EmployeeFormModal open={open} onClose={onClose} employee={employee} />
    </Provider>
  );
  return { store: s, onClose };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmployeeFormModal — add mode', () => {
  it('renders "Add Employee" in the modal when employee is null', () => {
    renderModal({ employee: null });
    // title div + submit button both contain "Add Employee"
    expect(screen.getAllByText('Add Employee').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the First name and Last name input fields', () => {
    renderModal({ employee: null });
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
  });

  it('shows an error Alert when employees.error is set after mount', async () => {
    // The modal's useEffect dispatches clearEmployeeError on open,
    // so we dispatch the error AFTER the component has mounted.
    const store = createStore();
    renderModal({ store });

    await act(async () => {
      store.dispatch({ type: 'CREATE_EMPLOYEE_FAILURE', payload: 'Duplicate email address' });
    });

    expect(screen.getByText('Duplicate email address')).toBeInTheDocument();
  });

  it('shows validation messages when submitted without required fields', async () => {
    renderModal({ employee: null });

    // Wrap the click in act() to flush Ant Design's async form validation
    await act(async () => {
      fireEvent.submit(document.querySelector('form'));
    });

    await waitFor(
      () => expect(screen.getByText('First name is required')).toBeInTheDocument(),
      { timeout: 6000 }
    );
  }, 15000);
});

describe('EmployeeFormModal — edit mode', () => {
  const existingEmployee = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '',
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'USA',
    city: '',
    salary: 80000,
    currency: 'USD',
    hireDate: '2022-01-01',
    employmentType: 'full_time',
    status: 'active',
  };

  it('renders "Edit Employee" as the modal title when employee prop is provided', () => {
    renderModal({ employee: existingEmployee });
    // modal title div contains "Edit Employee"
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
  });

  it('pre-fills the first name field with the existing employee data', () => {
    renderModal({ employee: existingEmployee });
    const firstNameInput = screen.getByPlaceholderText('First name');
    expect(firstNameInput.value).toBe('Jane');
  });
});
