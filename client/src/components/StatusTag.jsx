import React from 'react';
import { Tag } from 'antd';

const STATUS_COLORS = {
  active: 'green',
  inactive: 'red',
  on_leave: 'orange',
};

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
};

const StatusTag = ({ status }) => {
  const color = STATUS_COLORS[status] || 'default';
  const label = STATUS_LABELS[status] || status;
  return <Tag color={color}>{label}</Tag>;
};

export default StatusTag;
