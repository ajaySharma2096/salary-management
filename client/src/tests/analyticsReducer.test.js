import analyticsReducer from '../redux/reducers/analyticsReducer';
import * as actions from '../redux/actions/analyticsActions';

const initialState = {
  salaryByCountry: { data: [], loading: false, error: null },
  salaryByJobTitle: { data: [], loading: false, error: null },
  salaryDistribution: { data: [], loading: false, error: null },
  topEarners: { data: [], loading: false, error: null },
  departmentSummary: { data: [], loading: false, error: null },
};

describe('analyticsReducer', () => {
  it('returns correct initial state for unknown action', () => {
    expect(analyticsReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  // ─── salaryByCountry ─────────────────────────────────────────────────────

  it('sets loading=true on FETCH_SALARY_BY_COUNTRY_REQUEST', () => {
    const state = analyticsReducer(undefined, actions.fetchSalaryByCountryRequest());
    expect(state.salaryByCountry.loading).toBe(true);
    expect(state.salaryByCountry.error).toBeNull();
  });

  it('sets data and resets loading on FETCH_SALARY_BY_COUNTRY_SUCCESS', () => {
    const data = [{ country: 'India', avgSalary: 50000, employeeCount: 100 }];
    const state = analyticsReducer(undefined, actions.fetchSalaryByCountrySuccess(data));
    expect(state.salaryByCountry.data).toEqual(data);
    expect(state.salaryByCountry.loading).toBe(false);
    expect(state.salaryByCountry.error).toBeNull();
  });

  it('sets error on FETCH_SALARY_BY_COUNTRY_FAILURE', () => {
    const state = analyticsReducer(undefined, actions.fetchSalaryByCountryFailure('Server error'));
    expect(state.salaryByCountry.error).toBe('Server error');
    expect(state.salaryByCountry.loading).toBe(false);
    expect(state.salaryByCountry.data).toEqual([]);
  });

  // ─── salaryByJobTitle ─────────────────────────────────────────────────────

  it('sets loading on FETCH_SALARY_BY_JOB_TITLE_REQUEST', () => {
    const state = analyticsReducer(undefined, actions.fetchSalaryByJobTitleRequest('India'));
    expect(state.salaryByJobTitle.loading).toBe(true);
  });

  it('sets data on FETCH_SALARY_BY_JOB_TITLE_SUCCESS', () => {
    const data = [{ jobTitle: 'Engineer', avgSalary: 70000 }];
    const state = analyticsReducer(undefined, actions.fetchSalaryByJobTitleSuccess(data));
    expect(state.salaryByJobTitle.data).toEqual(data);
    expect(state.salaryByJobTitle.loading).toBe(false);
  });

  // ─── salaryDistribution ───────────────────────────────────────────────────

  it('sets data on FETCH_SALARY_DISTRIBUTION_SUCCESS', () => {
    const data = [{ range: '0-30000', count: 200, percentage: 20 }];
    const state = analyticsReducer(undefined, actions.fetchSalaryDistributionSuccess(data));
    expect(state.salaryDistribution.data).toEqual(data);
    expect(state.salaryDistribution.loading).toBe(false);
  });

  it('sets error on FETCH_SALARY_DISTRIBUTION_FAILURE', () => {
    const state = analyticsReducer(undefined, actions.fetchSalaryDistributionFailure('Network error'));
    expect(state.salaryDistribution.error).toBe('Network error');
  });

  // ─── topEarners ───────────────────────────────────────────────────────────

  it('sets loading on FETCH_TOP_EARNERS_REQUEST', () => {
    const state = analyticsReducer(undefined, actions.fetchTopEarnersRequest({ limit: 10 }));
    expect(state.topEarners.loading).toBe(true);
  });

  it('sets data on FETCH_TOP_EARNERS_SUCCESS', () => {
    const data = [{ id: 1, fullName: 'Alice Smith', salary: 200000 }];
    const state = analyticsReducer(undefined, actions.fetchTopEarnersSuccess(data));
    expect(state.topEarners.data).toEqual(data);
    expect(state.topEarners.loading).toBe(false);
  });

  it('sets error on FETCH_TOP_EARNERS_FAILURE', () => {
    const state = analyticsReducer(undefined, actions.fetchTopEarnersFailure('Failed'));
    expect(state.topEarners.error).toBe('Failed');
  });

  // ─── departmentSummary ────────────────────────────────────────────────────

  it('sets loading on FETCH_DEPARTMENT_SUMMARY_REQUEST', () => {
    const state = analyticsReducer(undefined, actions.fetchDepartmentSummaryRequest());
    expect(state.departmentSummary.loading).toBe(true);
  });

  it('sets data on FETCH_DEPARTMENT_SUMMARY_SUCCESS', () => {
    const data = [{ department: 'Engineering', employeeCount: 500, totalPayroll: 50000000 }];
    const state = analyticsReducer(undefined, actions.fetchDepartmentSummarySuccess(data));
    expect(state.departmentSummary.data).toEqual(data);
    expect(state.departmentSummary.loading).toBe(false);
  });

  it('does not affect other slices when one slice action is dispatched', () => {
    const state = analyticsReducer(undefined, actions.fetchSalaryByCountryRequest());
    // Only salaryByCountry should be loading
    expect(state.salaryByCountry.loading).toBe(true);
    expect(state.topEarners.loading).toBe(false);
    expect(state.departmentSummary.loading).toBe(false);
  });
});
