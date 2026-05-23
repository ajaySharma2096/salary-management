import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Alert,
  Row,
  Col,
  message,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { createEmployeeRequest, updateEmployeeRequest, clearEmployeeError } from '../redux/actions/employeeActions';

const { Option } = Select;

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Principal Engineer',
  'Engineering Manager', 'Product Manager', 'Data Analyst', 'Data Scientist',
  'HR Manager', 'HR Specialist', 'Recruiter', 'Finance Analyst', 'Accountant',
  'Marketing Manager', 'Marketing Specialist', 'Sales Manager', 'Sales Executive',
  'Operations Manager', 'Business Analyst', 'Project Manager', 'Scrum Master',
  'DevOps Engineer', 'QA Engineer', 'UX Designer', 'UI Designer', 'Technical Writer',
  'Customer Success Manager', 'Support Specialist', 'Legal Counsel', 'Director',
];

const DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Human Resources', 'Finance', 'Marketing',
  'Sales', 'Operations', 'Legal', 'Customer Success', 'Design', 'IT',
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia',
  'Singapore', 'United Arab Emirates', 'France', 'Brazil', 'Japan', 'Netherlands',
  'Sweden', 'Spain', 'Mexico', 'South Korea', 'Italy', 'Poland', 'Argentina', 'South Africa',
];

const CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'CAD', 'AUD', 'SGD', 'AED'];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
];

const EmployeeFormModal = ({ open, onClose, employee }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { submitting, error } = useSelector((state) => state.employees);
  const isEdit = Boolean(employee);

  useEffect(() => {
    if (open) {
      if (employee) {
        form.setFieldsValue({
          ...employee,
          hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ currency: 'USD', status: 'active', employmentType: 'full_time' });
      }
      dispatch(clearEmployeeError());
    }
  }, [open, employee, form, dispatch]);

  // Close modal automatically on successful submit
  const wasSubmitting = React.useRef(false);
  useEffect(() => {
    if (wasSubmitting.current && !submitting && !error) {
      message.success(`Employee ${isEdit ? 'updated' : 'created'} successfully.`);
      onClose();
    }
    wasSubmitting.current = submitting;
  }, [submitting, error, isEdit, onClose]);

  const onFinish = (values) => {
    const payload = {
      ...values,
      hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : undefined,
    };
    if (isEdit) {
      dispatch(updateEmployeeRequest(employee.id, payload));
    } else {
      dispatch(createEmployeeRequest(payload));
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => dispatch(clearEmployeeError())}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input placeholder="First name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input placeholder="Last name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="Email (optional)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Phone (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Job Title"
              name="jobTitle"
              rules={[{ required: true, message: 'Job title is required' }]}
            >
              <Select showSearch placeholder="Select or type job title" allowClear>
                {JOB_TITLES.map((t) => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Department"
              name="department"
              rules={[{ required: true, message: 'Department is required' }]}
            >
              <Select showSearch placeholder="Select department" allowClear>
                {DEPARTMENTS.map((d) => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Country"
              name="country"
              rules={[{ required: true, message: 'Country is required' }]}
            >
              <Select showSearch placeholder="Select country" allowClear>
                {COUNTRIES.map((c) => (
                  <Option key={c} value={c}>{c}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="City" name="city">
              <Input placeholder="City (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Salary"
              name="salary"
              rules={[{ required: true, message: 'Salary is required' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Annual salary"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/,/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Currency" name="currency" initialValue="USD">
              <Select>
                {CURRENCIES.map((c) => (
                  <Option key={c} value={c}>{c}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Employment Type" name="employmentType" initialValue="full_time">
              <Select>
                {EMPLOYMENT_TYPES.map(({ value, label }) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Status" name="status" initialValue="active">
              <Select>
                {STATUSES.map(({ value, label }) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Hire Date" name="hireDate">
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;
