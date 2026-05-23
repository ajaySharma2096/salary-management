import apiClient from './apiClient';

export const getEmployees = (params) => apiClient.get('/employees', { params });

export const getEmployee = (id) => apiClient.get(`/employees/${id}`);

export const createEmployee = (data) => apiClient.post('/employees', data);

export const updateEmployee = (id, data) => apiClient.put(`/employees/${id}`, data);

export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`);
