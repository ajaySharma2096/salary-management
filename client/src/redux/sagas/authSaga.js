import { call, put, takeLatest, all } from 'redux-saga/effects';
import * as authService from '../../services/authService';
import {
  AUTH_LOGIN_REQUEST,
  AUTH_SIGNUP_REQUEST,
  AUTH_LOGOUT_REQUEST,
  AUTH_FETCH_ME_REQUEST,
  loginSuccess,
  loginFailure,
  signupSuccess,
  signupFailure,
  logoutSuccess,
  fetchMeSuccess,
  fetchMeFailure,
} from '../actions/authActions';

export function* handleLogin(action) {
  try {
    const { email, password } = action.payload;
    const response = yield call(authService.login, email, password);
    yield put(loginSuccess(response.data.user));
  } catch (error) {
    const message =
      error.response?.data?.message || 'Login failed. Please try again.';
    yield put(loginFailure(message));
  }
}

export function* handleSignup(action) {
  try {
    const { email, password, firstName, lastName } = action.payload;
    yield call(authService.signup, email, password, firstName, lastName);
    yield put(signupSuccess());
  } catch (error) {
    const message =
      error.response?.data?.message || 'Signup failed. Please try again.';
    yield put(signupFailure(message));
  }
}

export function* handleLogout() {
  try {
    yield call(authService.logout);
  } finally {
    yield put(logoutSuccess());
  }
}

export function* handleFetchMe() {
  try {
    const response = yield call(authService.getMe);
    yield put(fetchMeSuccess(response.data.user));
  } catch {
    yield put(fetchMeFailure());
  }
}

function* watchLogin() {
  yield takeLatest(AUTH_LOGIN_REQUEST, handleLogin);
}

function* watchSignup() {
  yield takeLatest(AUTH_SIGNUP_REQUEST, handleSignup);
}

function* watchLogout() {
  yield takeLatest(AUTH_LOGOUT_REQUEST, handleLogout);
}

function* watchFetchMe() {
  yield takeLatest(AUTH_FETCH_ME_REQUEST, handleFetchMe);
}

export function* authSaga() {
  yield all([watchLogin(), watchSignup(), watchLogout(), watchFetchMe()]);
}
