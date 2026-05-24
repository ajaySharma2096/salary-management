// ─── Action Types ────────────────────────────────────────────────────────────

export const FETCH_SALARY_BY_COUNTRY_REQUEST = 'FETCH_SALARY_BY_COUNTRY_REQUEST';
export const FETCH_SALARY_BY_COUNTRY_SUCCESS = 'FETCH_SALARY_BY_COUNTRY_SUCCESS';
export const FETCH_SALARY_BY_COUNTRY_FAILURE = 'FETCH_SALARY_BY_COUNTRY_FAILURE';

export const FETCH_SALARY_BY_JOB_TITLE_REQUEST = 'FETCH_SALARY_BY_JOB_TITLE_REQUEST';
export const FETCH_SALARY_BY_JOB_TITLE_SUCCESS = 'FETCH_SALARY_BY_JOB_TITLE_SUCCESS';
export const FETCH_SALARY_BY_JOB_TITLE_FAILURE = 'FETCH_SALARY_BY_JOB_TITLE_FAILURE';

export const FETCH_SALARY_DISTRIBUTION_REQUEST = 'FETCH_SALARY_DISTRIBUTION_REQUEST';
export const FETCH_SALARY_DISTRIBUTION_SUCCESS = 'FETCH_SALARY_DISTRIBUTION_SUCCESS';
export const FETCH_SALARY_DISTRIBUTION_FAILURE = 'FETCH_SALARY_DISTRIBUTION_FAILURE';

export const FETCH_TOP_EARNERS_REQUEST = 'FETCH_TOP_EARNERS_REQUEST';
export const FETCH_TOP_EARNERS_SUCCESS = 'FETCH_TOP_EARNERS_SUCCESS';
export const FETCH_TOP_EARNERS_FAILURE = 'FETCH_TOP_EARNERS_FAILURE';

export const FETCH_DEPARTMENT_SUMMARY_REQUEST = 'FETCH_DEPARTMENT_SUMMARY_REQUEST';
export const FETCH_DEPARTMENT_SUMMARY_SUCCESS = 'FETCH_DEPARTMENT_SUMMARY_SUCCESS';
export const FETCH_DEPARTMENT_SUMMARY_FAILURE = 'FETCH_DEPARTMENT_SUMMARY_FAILURE';

// ─── Action Creators ──────────────────────────────────────────────────────────

export const fetchSalaryByCountryRequest = (country) => ({
  type: FETCH_SALARY_BY_COUNTRY_REQUEST,
  payload: { country },
});
export const fetchSalaryByCountrySuccess = (data) => ({
  type: FETCH_SALARY_BY_COUNTRY_SUCCESS,
  payload: data,
});
export const fetchSalaryByCountryFailure = (error) => ({
  type: FETCH_SALARY_BY_COUNTRY_FAILURE,
  payload: error,
});

export const fetchSalaryByJobTitleRequest = (country, jobTitle) => ({
  type: FETCH_SALARY_BY_JOB_TITLE_REQUEST,
  payload: { country, jobTitle },
});
export const fetchSalaryByJobTitleSuccess = (data) => ({
  type: FETCH_SALARY_BY_JOB_TITLE_SUCCESS,
  payload: data,
});
export const fetchSalaryByJobTitleFailure = (error) => ({
  type: FETCH_SALARY_BY_JOB_TITLE_FAILURE,
  payload: error,
});

export const fetchSalaryDistributionRequest = (country) => ({
  type: FETCH_SALARY_DISTRIBUTION_REQUEST,
  payload: { country },
});
export const fetchSalaryDistributionSuccess = (data) => ({
  type: FETCH_SALARY_DISTRIBUTION_SUCCESS,
  payload: data,
});
export const fetchSalaryDistributionFailure = (error) => ({
  type: FETCH_SALARY_DISTRIBUTION_FAILURE,
  payload: error,
});

export const fetchTopEarnersRequest = (params) => ({
  type: FETCH_TOP_EARNERS_REQUEST,
  payload: params,
});
export const fetchTopEarnersSuccess = (data) => ({
  type: FETCH_TOP_EARNERS_SUCCESS,
  payload: data,
});
export const fetchTopEarnersFailure = (error) => ({
  type: FETCH_TOP_EARNERS_FAILURE,
  payload: error,
});

export const fetchDepartmentSummaryRequest = () => ({
  type: FETCH_DEPARTMENT_SUMMARY_REQUEST,
});
export const fetchDepartmentSummarySuccess = (data) => ({
  type: FETCH_DEPARTMENT_SUMMARY_SUCCESS,
  payload: data,
});
export const fetchDepartmentSummaryFailure = (error) => ({
  type: FETCH_DEPARTMENT_SUMMARY_FAILURE,
  payload: error,
});
