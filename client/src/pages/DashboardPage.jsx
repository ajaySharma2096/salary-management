import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Select,
  Typography,
  Progress,
  Space,
  Spin,
} from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  GlobalOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSalaryByCountryRequest,
  fetchSalaryByJobTitleRequest,
  fetchSalaryDistributionRequest,
  fetchTopEarnersRequest,
  fetchDepartmentSummaryRequest,
} from '../redux/actions/analyticsActions';
import { formatSalary } from '../utils/formatters';

const { Title } = Typography;
const { Option } = Select;

const DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Human Resources', 'Finance', 'Marketing',
  'Sales', 'Operations', 'Legal', 'Customer Success', 'Design', 'IT',
];

const DISTRIBUTION_COLORS = ['#4096ff', '#73d13d', '#ffa940', '#ff4d4f', '#722ed1'];

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { salaryByCountry, salaryByJobTitle, salaryDistribution, topEarners, departmentSummary } =
    useSelector((state) => state.analytics);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [topEarnersParams, setTopEarnersParams] = useState({ limit: 10 });

  // Load all analytics on mount
  useEffect(() => {
    dispatch(fetchSalaryByCountryRequest());
    dispatch(fetchSalaryDistributionRequest());
    dispatch(fetchTopEarnersRequest({ limit: 10 }));
    dispatch(fetchDepartmentSummaryRequest());
  }, [dispatch]);

  // Load salary by job title when a country is selected
  useEffect(() => {
    if (selectedCountry) {
      dispatch(fetchSalaryByJobTitleRequest(selectedCountry));
    }
  }, [selectedCountry, dispatch]);

  // Refresh top earners when params change
  useEffect(() => {
    dispatch(fetchTopEarnersRequest(topEarnersParams));
  }, [topEarnersParams, dispatch]);

  // ─── Stats ───────────────────────────────────────────────────────────────

  const totalEmployees = departmentSummary.data.reduce(
    (sum, d) => sum + (Number(d.employeeCount) || 0),
    0
  );
  const totalPayroll = departmentSummary.data.reduce(
    (sum, d) => sum + (Number(d.totalPayroll) || 0),
    0
  );
  const avgSalary =
    totalEmployees > 0
      ? salaryByCountry.data.reduce((sum, c) => sum + Number(c.avgSalary || 0) * Number(c.employeeCount || 0), 0) /
        Math.max(salaryByCountry.data.reduce((s, c) => s + Number(c.employeeCount || 0), 0), 1)
      : 0;
  const countriesCount = salaryByCountry.data.length;

  // ─── Country Salary Table ─────────────────────────────────────────────────

  const countrySalaryColumns = [
    { title: 'Country', dataIndex: 'country', key: 'country', sorter: (a, b) => a.country.localeCompare(b.country) },
    {
      title: 'Min Salary',
      dataIndex: 'minSalary',
      key: 'minSalary',
      render: (v) => formatSalary(v, 'USD'),
      sorter: (a, b) => a.minSalary - b.minSalary,
    },
    {
      title: 'Max Salary',
      dataIndex: 'maxSalary',
      key: 'maxSalary',
      render: (v) => formatSalary(v, 'USD'),
      sorter: (a, b) => a.maxSalary - b.maxSalary,
    },
    {
      title: 'Avg Salary',
      dataIndex: 'avgSalary',
      key: 'avgSalary',
      defaultSortOrder: 'descend',
      render: (v) => formatSalary(v, 'USD'),
      sorter: (a, b) => a.avgSalary - b.avgSalary,
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      sorter: (a, b) => a.employeeCount - b.employeeCount,
    },
  ];

  // ─── Job Title Breakdown Table ────────────────────────────────────────────

  const jobTitleColumns = [
    { title: 'Job Title', dataIndex: 'jobTitle', key: 'jobTitle' },
    {
      title: 'Min Salary',
      dataIndex: 'minSalary',
      key: 'minSalary',
      render: (v) => formatSalary(v, 'USD'),
    },
    {
      title: 'Max Salary',
      dataIndex: 'maxSalary',
      key: 'maxSalary',
      render: (v) => formatSalary(v, 'USD'),
    },
    {
      title: 'Avg Salary',
      dataIndex: 'avgSalary',
      key: 'avgSalary',
      render: (v) => formatSalary(v, 'USD'),
      sorter: (a, b) => a.avgSalary - b.avgSalary,
      defaultSortOrder: 'descend',
    },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount' },
  ];

  // ─── Salary Distribution ─────────────────────────────────────────────────

  const maxDistCount = Math.max(
    ...salaryDistribution.data.map((b) => b.count || 0),
    1
  );

  // ─── Top Earners Table ────────────────────────────────────────────────────

  const topEarnerColumns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Name',
      key: 'fullName',
      render: (_, r) => r.fullName || `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
    },
    { title: 'Job Title', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (v, r) => formatSalary(v, r.currency || 'USD'),
    },
  ];

  // ─── Department Summary Table ─────────────────────────────────────────────

  const deptColumns = [
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount' },
    {
      title: 'Avg Salary',
      dataIndex: 'avgSalary',
      key: 'avgSalary',
      render: (v) => formatSalary(v, 'USD'),
    },
    {
      title: 'Total Payroll',
      dataIndex: 'totalPayroll',
      key: 'totalPayroll',
      render: (v) => formatSalary(v, 'USD'),
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.totalPayroll - b.totalPayroll,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Salary Insights Dashboard
      </Title>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Salary"
              value={avgSalary.toFixed(0)}
              prefix={<DollarOutlined />}
              formatter={(v) => formatSalary(Number(v), 'USD')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Countries"
              value={countriesCount}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Annual Payroll"
              value={totalPayroll.toFixed(0)}
              prefix={<FundOutlined />}
              formatter={(v) => formatSalary(Number(v), 'USD')}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Country Salary Table ────────────────────────────────────────── */}
      <Card
        title="Salary by Country"
        style={{ marginBottom: 24 }}
        extra={
          <Select
            placeholder="Filter by country"
            allowClear
            style={{ width: 200 }}
            value={selectedCountry}
            onChange={(v) => setSelectedCountry(v || null)}
          >
            {salaryByCountry.data.map((c) => (
              <Option key={c.country} value={c.country}>
                {c.country}
              </Option>
            ))}
          </Select>
        }
      >
        <Table
          rowKey="country"
          columns={countrySalaryColumns}
          dataSource={
            selectedCountry
              ? salaryByCountry.data.filter((c) => c.country === selectedCountry)
              : salaryByCountry.data
          }
          loading={salaryByCountry.loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* ── Job Title Breakdown ─────────────────────────────────────────── */}
      {selectedCountry && (
        <Card
          title={`Job Title Breakdown — ${selectedCountry}`}
          style={{ marginBottom: 24 }}
        >
          <Table
            rowKey="jobTitle"
            columns={jobTitleColumns}
            dataSource={salaryByJobTitle.data}
            loading={salaryByJobTitle.loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}

      {/* ── Salary Distribution ─────────────────────────────────────────── */}
      <Card title="Salary Distribution" style={{ marginBottom: 24 }}>
        {salaryDistribution.loading ? (
          <Spin />
        ) : (
          <div>
            {salaryDistribution.data.map((bucket, i) => (
              <div key={bucket.range} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Typography.Text strong>{bucket.range}</Typography.Text>
                  <Typography.Text type="secondary">
                    {bucket.count} employees ({bucket.percentage}%)
                  </Typography.Text>
                </div>
                <Progress
                  percent={Math.round((bucket.count / maxDistCount) * 100)}
                  showInfo={false}
                  strokeColor={DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Top Earners ─────────────────────────────────────────────────── */}
      <Card
        title="Top Earners"
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Select
              placeholder="Country"
              allowClear
              style={{ width: 140 }}
              onChange={(v) =>
                setTopEarnersParams((p) => ({ ...p, country: v || undefined }))
              }
            >
              {salaryByCountry.data.map((c) => (
                <Option key={c.country} value={c.country}>
                  {c.country}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Department"
              allowClear
              style={{ width: 150 }}
              onChange={(v) =>
                setTopEarnersParams((p) => ({ ...p, department: v || undefined }))
              }
            >
              {DEPARTMENTS.map((d) => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
            <Select
              value={topEarnersParams.limit}
              style={{ width: 80 }}
              onChange={(v) => setTopEarnersParams((p) => ({ ...p, limit: v }))}
            >
              <Option value={10}>10</Option>
              <Option value={25}>25</Option>
              <Option value={50}>50</Option>
            </Select>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={topEarnerColumns}
          dataSource={topEarners.data}
          loading={topEarners.loading}
          pagination={false}
          size="small"
        />
      </Card>

      {/* ── Department Payroll Summary ───────────────────────────────────── */}
      <Card title="Department Payroll Summary">
        <Table
          rowKey="department"
          columns={deptColumns}
          dataSource={departmentSummary.data}
          loading={departmentSummary.loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
