import {
  FETCH_SALARY_BY_COUNTRY_REQUEST,
  FETCH_SALARY_BY_COUNTRY_SUCCESS,
  FETCH_SALARY_BY_COUNTRY_FAILURE,
  FETCH_SALARY_BY_JOB_TITLE_REQUEST,
  FETCH_SALARY_BY_JOB_TITLE_SUCCESS,
  FETCH_SALARY_BY_JOB_TITLE_FAILURE,
  FETCH_SALARY_DISTRIBUTION_REQUEST,
  FETCH_SALARY_DISTRIBUTION_SUCCESS,
  FETCH_SALARY_DISTRIBUTION_FAILURE,
  FETCH_TOP_EARNERS_REQUEST,
  FETCH_TOP_EARNERS_SUCCESS,
  FETCH_TOP_EARNERS_FAILURE,
  FETCH_DEPARTMENT_SUMMARY_REQUEST,
  FETCH_DEPARTMENT_SUMMARY_SUCCESS,
  FETCH_DEPARTMENT_SUMMARY_FAILURE,
} from '../actions/analyticsActions';

const slice = (request, success, failure) => (
  state = { data: [], loading: false, error: null },
  action
) => {
  switch (action.type) {
    case request:
      return { ...state, loading: true, error: null };
    case success:
      return { data: action.payload, loading: false, error: null };
    case failure:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const salaryByCountry = slice(
  FETCH_SALARY_BY_COUNTRY_REQUEST,
  FETCH_SALARY_BY_COUNTRY_SUCCESS,
  FETCH_SALARY_BY_COUNTRY_FAILURE
);

const salaryByJobTitle = slice(
  FETCH_SALARY_BY_JOB_TITLE_REQUEST,
  FETCH_SALARY_BY_JOB_TITLE_SUCCESS,
  FETCH_SALARY_BY_JOB_TITLE_FAILURE
);

const salaryDistribution = slice(
  FETCH_SALARY_DISTRIBUTION_REQUEST,
  FETCH_SALARY_DISTRIBUTION_SUCCESS,
  FETCH_SALARY_DISTRIBUTION_FAILURE
);

const topEarners = slice(
  FETCH_TOP_EARNERS_REQUEST,
  FETCH_TOP_EARNERS_SUCCESS,
  FETCH_TOP_EARNERS_FAILURE
);

const departmentSummary = slice(
  FETCH_DEPARTMENT_SUMMARY_REQUEST,
  FETCH_DEPARTMENT_SUMMARY_SUCCESS,
  FETCH_DEPARTMENT_SUMMARY_FAILURE
);

const analyticsReducer = (state = {}, action) => ({
  salaryByCountry: salaryByCountry(state.salaryByCountry, action),
  salaryByJobTitle: salaryByJobTitle(state.salaryByJobTitle, action),
  salaryDistribution: salaryDistribution(state.salaryDistribution, action),
  topEarners: topEarners(state.topEarners, action),
  departmentSummary: departmentSummary(state.departmentSummary, action),
});

export default analyticsReducer;
