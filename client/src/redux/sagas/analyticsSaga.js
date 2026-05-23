import { call, put, takeLatest, all } from 'redux-saga/effects';
import * as analyticsService from '../../services/analyticsService';
import {
  FETCH_SALARY_BY_COUNTRY_REQUEST,
  FETCH_SALARY_BY_JOB_TITLE_REQUEST,
  FETCH_SALARY_DISTRIBUTION_REQUEST,
  FETCH_TOP_EARNERS_REQUEST,
  FETCH_DEPARTMENT_SUMMARY_REQUEST,
  fetchSalaryByCountrySuccess,
  fetchSalaryByCountryFailure,
  fetchSalaryByJobTitleSuccess,
  fetchSalaryByJobTitleFailure,
  fetchSalaryDistributionSuccess,
  fetchSalaryDistributionFailure,
  fetchTopEarnersSuccess,
  fetchTopEarnersFailure,
  fetchDepartmentSummarySuccess,
  fetchDepartmentSummaryFailure,
} from '../actions/analyticsActions';

function* handleFetchSalaryByCountry(action) {
  try {
    const response = yield call(analyticsService.getSalaryByCountry, action.payload?.country);
    yield put(fetchSalaryByCountrySuccess(response.data));
  } catch (error) {
    yield put(fetchSalaryByCountryFailure(error.response?.data?.message || 'Failed to fetch salary by country.'));
  }
}

function* handleFetchSalaryByJobTitle(action) {
  try {
    const { country, jobTitle } = action.payload || {};
    const response = yield call(analyticsService.getSalaryByJobTitle, country, jobTitle);
    yield put(fetchSalaryByJobTitleSuccess(response.data));
  } catch (error) {
    yield put(fetchSalaryByJobTitleFailure(error.response?.data?.message || 'Failed to fetch salary by job title.'));
  }
}

function* handleFetchSalaryDistribution(action) {
  try {
    const response = yield call(analyticsService.getSalaryDistribution, action.payload?.country);
    yield put(fetchSalaryDistributionSuccess(response.data));
  } catch (error) {
    yield put(fetchSalaryDistributionFailure(error.response?.data?.message || 'Failed to fetch salary distribution.'));
  }
}

function* handleFetchTopEarners(action) {
  try {
    const response = yield call(analyticsService.getTopEarners, action.payload);
    yield put(fetchTopEarnersSuccess(response.data));
  } catch (error) {
    yield put(fetchTopEarnersFailure(error.response?.data?.message || 'Failed to fetch top earners.'));
  }
}

function* handleFetchDepartmentSummary() {
  try {
    const response = yield call(analyticsService.getDepartmentSummary);
    yield put(fetchDepartmentSummarySuccess(response.data));
  } catch (error) {
    yield put(fetchDepartmentSummaryFailure(error.response?.data?.message || 'Failed to fetch department summary.'));
  }
}

export function* analyticsSaga() {
  yield all([
    takeLatest(FETCH_SALARY_BY_COUNTRY_REQUEST, handleFetchSalaryByCountry),
    takeLatest(FETCH_SALARY_BY_JOB_TITLE_REQUEST, handleFetchSalaryByJobTitle),
    takeLatest(FETCH_SALARY_DISTRIBUTION_REQUEST, handleFetchSalaryDistribution),
    takeLatest(FETCH_TOP_EARNERS_REQUEST, handleFetchTopEarners),
    takeLatest(FETCH_DEPARTMENT_SUMMARY_REQUEST, handleFetchDepartmentSummary),
  ]);
}
