import apiClient from './apiClient';

export const getSalaryByCountry = (country) =>
  apiClient.get('/analytics/salary-by-country', { params: { country } });

export const getSalaryByJobTitle = (country, jobTitle) =>
  apiClient.get('/analytics/salary-by-job-title', { params: { country, jobTitle } });

export const getSalaryDistribution = (country) =>
  apiClient.get('/analytics/salary-distribution', { params: { country } });

export const getTopEarners = (params) =>
  apiClient.get('/analytics/top-earners', { params });

export const getDepartmentSummary = () =>
  apiClient.get('/analytics/department-summary');
