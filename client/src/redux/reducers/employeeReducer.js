import {
  FETCH_EMPLOYEES_REQUEST,
  FETCH_EMPLOYEES_SUCCESS,
  FETCH_EMPLOYEES_FAILURE,
  FETCH_EMPLOYEE_SUCCESS,
  CREATE_EMPLOYEE_REQUEST,
  CREATE_EMPLOYEE_SUCCESS,
  CREATE_EMPLOYEE_FAILURE,
  UPDATE_EMPLOYEE_REQUEST,
  UPDATE_EMPLOYEE_SUCCESS,
  UPDATE_EMPLOYEE_FAILURE,
  DELETE_EMPLOYEE_REQUEST,
  DELETE_EMPLOYEE_SUCCESS,
  DELETE_EMPLOYEE_FAILURE,
  SET_EMPLOYEE_FILTERS,
  CLEAR_EMPLOYEE_ERROR,
} from '../actions/employeeActions';

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

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_EMPLOYEES_REQUEST:
      return { ...state, loading: true, error: null };

    case FETCH_EMPLOYEES_SUCCESS:
      return {
        ...state,
        loading: false,
        list: action.payload.data,
        total: action.payload.total,
        page: action.payload.page,
        limit: action.payload.limit,
        totalPages: action.payload.totalPages,
      };

    case FETCH_EMPLOYEES_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case FETCH_EMPLOYEE_SUCCESS:
      return { ...state, currentEmployee: action.payload };

    case CREATE_EMPLOYEE_REQUEST:
    case UPDATE_EMPLOYEE_REQUEST:
    case DELETE_EMPLOYEE_REQUEST:
      return { ...state, submitting: true, error: null };

    case CREATE_EMPLOYEE_SUCCESS:
    case UPDATE_EMPLOYEE_SUCCESS:
    case DELETE_EMPLOYEE_SUCCESS:
      return { ...state, submitting: false, error: null };

    case CREATE_EMPLOYEE_FAILURE:
    case UPDATE_EMPLOYEE_FAILURE:
    case DELETE_EMPLOYEE_FAILURE:
      return { ...state, submitting: false, error: action.payload };

    case SET_EMPLOYEE_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        page: 1,
      };

    case CLEAR_EMPLOYEE_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

export default employeeReducer;
