import apiClient from './apiClient';

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const signup = (email, password, firstName, lastName) =>
  apiClient.post('/auth/signup', { email, password, firstName, lastName });

export const logout = () => apiClient.post('/auth/logout');

export const getMe = () => apiClient.get('/auth/me');
