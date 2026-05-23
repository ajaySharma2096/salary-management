import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from '../pages/LoginPage';
import authReducer from '../redux/reducers/authReducer';

// ─── Helper ───────────────────────────────────────────────────────────────────

function createAuthStore(authOverrides = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...authOverrides,
      },
    },
  });
}

function renderLoginPage(authOverrides = {}) {
  const store = createAuthStore(authOverrides);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('renders the sign-in heading', () => {
    renderLoginPage();
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it('renders the email input field', () => {
    renderLoginPage();
    expect(
      screen.getByPlaceholderText('admin@company.com')
    ).toBeInTheDocument();
  });

  it('renders the password input field', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('displays an error Alert when auth.error is set', () => {
    renderLoginPage({ error: 'Invalid credentials' });
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('does not display an error Alert when auth.error is null', () => {
    renderLoginPage({ error: null });
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });
});
