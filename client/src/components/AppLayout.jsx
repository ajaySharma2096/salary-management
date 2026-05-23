import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, theme } from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutRequest } from '../redux/actions/authActions';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { token } = theme.useToken();

  const handleLogout = () => {
    dispatch(logoutRequest());
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: 'Employees',
      onClick: () => navigate('/employees'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ background: token.colorBgContainer }}
      >
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 8px',
            fontWeight: 700,
            fontSize: collapsed ? 12 : 16,
            color: token.colorPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'SM' : 'Salary Management'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Text strong style={{ fontSize: 16 }}>
              Salary Management
            </Text>
          </Space>

          <Space>
            {user && (
              <Text type="secondary">
                {user.firstName} {user.lastName}
              </Text>
            )}
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              {!collapsed && 'Logout'}
            </Button>
          </Space>
        </Header>

        <Content style={{ background: '#f0f2f5', padding: 24, overflowY: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
