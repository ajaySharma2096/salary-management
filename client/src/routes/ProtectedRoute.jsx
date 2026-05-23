import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { fetchMeRequest } from '../redux/actions/authActions';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMeRequest());
    }
  }, [user, dispatch]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
