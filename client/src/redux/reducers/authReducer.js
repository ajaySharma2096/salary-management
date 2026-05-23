import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_SIGNUP_REQUEST,
  AUTH_SIGNUP_SUCCESS,
  AUTH_SIGNUP_FAILURE,
  AUTH_LOGOUT_SUCCESS,
  AUTH_FETCH_ME_REQUEST,
  AUTH_FETCH_ME_SUCCESS,
  AUTH_FETCH_ME_FAILURE,
  AUTH_CLEAR_ERROR,
} from '../actions/authActions';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_LOGIN_REQUEST:
    case AUTH_SIGNUP_REQUEST:
    case AUTH_FETCH_ME_REQUEST:
      return { ...state, loading: true, error: null };

    case AUTH_LOGIN_SUCCESS:
    case AUTH_FETCH_ME_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };

    case AUTH_LOGIN_FAILURE:
    case AUTH_SIGNUP_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case AUTH_FETCH_ME_FAILURE:
      return { ...state, loading: false, user: null, isAuthenticated: false };

    case AUTH_SIGNUP_SUCCESS:
      return { ...state, loading: false, error: null };

    case AUTH_LOGOUT_SUCCESS:
      return { ...initialState };

    case AUTH_CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

export default authReducer;
