import { runSaga } from 'redux-saga';
import authReducer from '../redux/reducers/authReducer';
import * as authActions from '../redux/actions/authActions';
import { handleLogin, handleSignup } from '../redux/sagas/authSaga';

// Mock the authService module entirely — avoids importing apiClient (import.meta.env)
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
  getMe: jest.fn(),
}));

const authService = require('../services/authService');

// ─── Reducer Tests ──────────────────────────────────────────────────────────

describe('authReducer', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('returns initial state for unknown action', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets loading=true on AUTH_LOGIN_REQUEST', () => {
    const state = authReducer(initialState, authActions.loginRequest('a@b.com', 'pw'));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets user and isAuthenticated on AUTH_LOGIN_SUCCESS', () => {
    const user = { id: 1, email: 'a@b.com' };
    const state = authReducer(initialState, authActions.loginSuccess(user));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('sets error on AUTH_LOGIN_FAILURE', () => {
    const state = authReducer(initialState, authActions.loginFailure('Invalid credentials'));
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets loading=true on AUTH_SIGNUP_REQUEST', () => {
    const state = authReducer(initialState, authActions.signupRequest('a@b.com', 'pw', 'A', 'B'));
    expect(state.loading).toBe(true);
  });

  it('resets loading on AUTH_SIGNUP_SUCCESS', () => {
    const state = authReducer({ ...initialState, loading: true }, authActions.signupSuccess());
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error on AUTH_SIGNUP_FAILURE', () => {
    const state = authReducer(initialState, authActions.signupFailure('Email exists'));
    expect(state.error).toBe('Email exists');
    expect(state.loading).toBe(false);
  });

  it('clears state on AUTH_LOGOUT_SUCCESS', () => {
    const loggedIn = { user: { id: 1 }, isAuthenticated: true, loading: false, error: null };
    const state = authReducer(loggedIn, authActions.logoutSuccess());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clears error on AUTH_CLEAR_ERROR', () => {
    const withError = { ...initialState, error: 'some error' };
    const state = authReducer(withError, authActions.clearError());
    expect(state.error).toBeNull();
  });

  it('sets loading on AUTH_FETCH_ME_REQUEST', () => {
    const state = authReducer(initialState, authActions.fetchMeRequest());
    expect(state.loading).toBe(true);
  });

  it('sets user on AUTH_FETCH_ME_SUCCESS', () => {
    const user = { id: 2, email: 'x@y.com' };
    const state = authReducer(initialState, authActions.fetchMeSuccess(user));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears auth on AUTH_FETCH_ME_FAILURE', () => {
    const loggedIn = { user: { id: 1 }, isAuthenticated: true, loading: true, error: null };
    const state = authReducer(loggedIn, authActions.fetchMeFailure());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });
});

// ─── Saga Tests ──────────────────────────────────────────────────────────────

async function runSagaWithActions(saga, action) {
  const dispatched = [];
  await runSaga(
    {
      dispatch: (a) => dispatched.push(a),
      getState: () => ({}),
    },
    saga,
    action
  ).toPromise();
  return dispatched;
}

describe('authSaga — handleLogin', () => {
  afterEach(() => jest.clearAllMocks());

  it('dispatches loginSuccess on successful login', async () => {
    const user = { id: 1, email: 'a@b.com' };
    authService.login.mockResolvedValue({ data: { user } });

    // Import handleLogin via generator approach
    const action = authActions.loginRequest('a@b.com', 'Secret@1');
    const dispatched = await runSagaWithActions(handleLogin, action);

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'Secret@1');
    expect(dispatched).toContainEqual(authActions.loginSuccess(user));
  });

  it('dispatches loginFailure on failed login', async () => {
    authService.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const action = authActions.loginRequest('a@b.com', 'wrong');
    const dispatched = await runSagaWithActions(handleLogin, action);

    expect(dispatched).toContainEqual(authActions.loginFailure('Invalid credentials'));
  });
});

describe('authSaga — handleSignup', () => {
  afterEach(() => jest.clearAllMocks());

  it('dispatches signupSuccess on successful signup', async () => {
    authService.signup.mockResolvedValue({ data: {} });

    const action = authActions.signupRequest('a@b.com', 'Secret@1', 'Alice', 'Smith');
    const dispatched = await runSagaWithActions(handleSignup, action);

    expect(authService.signup).toHaveBeenCalledWith('a@b.com', 'Secret@1', 'Alice', 'Smith');
    expect(dispatched).toContainEqual(authActions.signupSuccess());
  });

  it('dispatches signupFailure on failed signup', async () => {
    authService.signup.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });

    const action = authActions.signupRequest('a@b.com', 'Secret@1', 'Alice', 'Smith');
    const dispatched = await runSagaWithActions(handleSignup, action);

    expect(dispatched).toContainEqual(authActions.signupFailure('Email already exists'));
  });
});
