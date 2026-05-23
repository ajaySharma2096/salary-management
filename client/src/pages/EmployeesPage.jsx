import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  Typography,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployeesRequest,
  deleteEmployeeRequest,
  setEmployeeFilters,
} from '../redux/actions/employeeActions';
import StatusTag from '../components/StatusTag';
import EmployeeFormModal from '../components/EmployeeFormModal';
import { formatSalary, formatDate } from '../utils/formatters';

const { Title } = Typography;
const { Option } = Select;

const DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Human Resources', 'Finance', 'Marketing',
  'Sales', 'Operations', 'Legal', 'Customer Success', 'Design', 'IT',
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
];

const EmployeesPage = () => {
  const dispatch = useDispatch();
  const { list, total, page, limit, filters, loading } = useSelector(
    (state) => state.employees
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const searchTimer = useRef(null);

  // Derive unique countries from current data
  const countries = [...new Set(list.map((e) => e.country).filter(Boolean))].sort();

  useEffect(() => {
    dispatch(fetchEmployeesRequest());
  }, [dispatch]);

  const handleTableChange = (pagination, _filters, sorter) => {
    const params = { page: pagination.current, limit: pagination.pageSize };
    if (sorter.field) {
      params.sortBy = sorter.field;
      params.sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }
    dispatch(fetchEmployeesRequest(params));
  };

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        dispatch(setEmployeeFilters({ search: value }));
        dispatch(fetchEmployeesRequest({ page: 1 }));
      }, 400);
    },
    [dispatch]
  );

  const handleFilterChange = (field, value) => {
    dispatch(setEmployeeFilters({ [field]: value ?? '' }));
    dispatch(fetchEmployeesRequest({ page: 1 }));
  };

  const handleClearFilters = () => {
    dispatch(
      setEmployeeFilters({ search: '', country: '', department: '', status: '' })
    );
    dispatch(fetchEmployeesRequest({ page: 1 }));
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingEmployee(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = (id) => {
    dispatch(deleteEmployeeRequest(id));
  };

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v) => v || '—',
    },
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      sorter: true,
      render: (salary, record) => formatSalary(salary, record.currency),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Hire Date',
      dataIndex: 'hireDate',
      key: 'hireDate',
      sorter: true,
      render: (d) => formatDate(d),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this employee?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Employees
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Employee
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="1 1 220px">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by name or email…"
              defaultValue={filters.search}
              onChange={handleSearchChange}
              allowClear
            />
          </Col>
          <Col flex="1 1 160px">
            <Select
              placeholder="Country"
              allowClear
              style={{ width: '100%' }}
              value={filters.country || undefined}
              onChange={(v) => handleFilterChange('country', v)}
            >
              {countries.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          </Col>
          <Col flex="1 1 160px">
            <Select
              placeholder="Department"
              allowClear
              style={{ width: '100%' }}
              value={filters.department || undefined}
              onChange={(v) => handleFilterChange('department', v)}
            >
              {DEPARTMENTS.map((d) => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
          </Col>
          <Col flex="1 1 140px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(v) => handleFilterChange('status', v)}
            >
              {STATUSES.map(({ value, label }) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
              Clear
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} employees`,
        }}
        onChange={handleTableChange}
      />

      <EmployeeFormModal
        open={modalOpen}
        onClose={closeModal}
        employee={editingEmployee}
      />
    </div>
  );
};

export default EmployeesPage;
