// Action Types
export const AUTH_LOGIN_REQUEST = 'AUTH_LOGIN_REQUEST';
export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS';
export const AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE';

export const AUTH_SIGNUP_REQUEST = 'AUTH_SIGNUP_REQUEST';
export const AUTH_SIGNUP_SUCCESS = 'AUTH_SIGNUP_SUCCESS';
export const AUTH_SIGNUP_FAILURE = 'AUTH_SIGNUP_FAILURE';

export const AUTH_LOGOUT_REQUEST = 'AUTH_LOGOUT_REQUEST';
export const AUTH_LOGOUT_SUCCESS = 'AUTH_LOGOUT_SUCCESS';

export const AUTH_FETCH_ME_REQUEST = 'AUTH_FETCH_ME_REQUEST';
export const AUTH_FETCH_ME_SUCCESS = 'AUTH_FETCH_ME_SUCCESS';
export const AUTH_FETCH_ME_FAILURE = 'AUTH_FETCH_ME_FAILURE';

export const AUTH_CLEAR_ERROR = 'AUTH_CLEAR_ERROR';

// Action Creators
export const loginRequest = (email, password) => ({
  type: AUTH_LOGIN_REQUEST,
  payload: { email, password },
});

export const loginSuccess = (user) => ({
  type: AUTH_LOGIN_SUCCESS,
  payload: user,
});

export const loginFailure = (error) => ({
  type: AUTH_LOGIN_FAILURE,
  payload: error,
});

export const signupRequest = (email, password, firstName, lastName) => ({
  type: AUTH_SIGNUP_REQUEST,
  payload: { email, password, firstName, lastName },
});

export const signupSuccess = () => ({
  type: AUTH_SIGNUP_SUCCESS,
});

export const signupFailure = (error) => ({
  type: AUTH_SIGNUP_FAILURE,
  payload: error,
});

export const logoutRequest = () => ({
  type: AUTH_LOGOUT_REQUEST,
});

export const logoutSuccess = () => ({
  type: AUTH_LOGOUT_SUCCESS,
});

export const fetchMeRequest = () => ({
  type: AUTH_FETCH_ME_REQUEST,
});

export const fetchMeSuccess = (user) => ({
  type: AUTH_FETCH_ME_SUCCESS,
  payload: user,
});

export const fetchMeFailure = () => ({
  type: AUTH_FETCH_ME_FAILURE,
});

export const clearError = () => ({
  type: AUTH_CLEAR_ERROR,
});
