import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, Checkbox } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  type: 'order' | 'payment' | 'account' | 'promotion';
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  user: {
    _id: string;
    userName: string;
  };
  createdAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ _id: string; userName: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchUsers = async () => {
    try {
      if (!tokens?.accessToken) return;
      const response = await axios.get('http://localhost:8889/api/v1/users', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { limit: 1000 },
      });
      setUsers(response.data.data.users || []);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/notifications', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setNotifications(response.data.data.notifications);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any, defaultMessage: string) => {
    if (error.response?.status === 401) {
      message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      navigate('/login');
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error(defaultMessage);
    }
  };

  const handleAddNotification = () => {
    setSelectedNotification(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    form.setFieldsValue({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      user: notification.user?._id,
      isRead: notification.isRead,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }
      setSaving(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        user: values.user,
      };
      if (selectedNotification) {
        await axios.put(`http://localhost:8889/api/v1/notifications/${selectedNotification._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Cập nhật thông báo thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/notifications', payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Tạo mới thông báo thành công');
      }
      setIsModalOpen(false);
      fetchNotifications();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý thông báo');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      await axios.put(`http://localhost:8889/api/v1/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      message.success('Đánh dấu thông báo thành công');
      fetchNotifications();
    } catch (error: any) {
      handleError(error, 'Lỗi khi đánh dấu thông báo');
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const columns = [
    { 
      title: 'Loại', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: { color: string; label: string } } = {
          'order': { color: '#1890ff', label: 'Đơn Hàng' },
          'payment': { color: '#2db7f5', label: 'Thanh Toán' },
          'account': { color: '#87d068', label: 'Tài Khoản' },
          'promotion': { color: '#f50', label: 'Khuyến Mãi' }
        };
        return <span style={{ color: typeMap[type]?.color }}>{typeMap[type]?.label}</span>;
      }
    },
    { 
      title: 'Tiêu Đề', 
      dataIndex: 'title', 
      key: 'title'
    },
    { 
      title: 'Nội Dung', 
      dataIndex: 'message', 
      key: 'message'
    },
    { 
      title: 'Người Nhận', 
      dataIndex: ['user', 'userName'], 
      key: 'user',
      render: (_: any, record: Notification) => record.user?.userName || ''
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'isRead', 
      key: 'isRead',
      render: (isRead: boolean, record: Notification) => (
        <Button
          type="text"
          icon={isRead ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => handleMarkAsRead(isRead ? '' : record._id)}
        >
          {isRead ? 'Đã Đọc' : 'Chưa Đọc'}
        </Button>
      )
    },
    { 
      title: 'Ngày Tạo', 
      dataIndex: 'createdAt', 
      key: 'createdAt'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Notification) => (
        <Button type="primary" onClick={() => handleEditNotification(record)}>Sửa</Button>
      )
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Danh Sách Thông Báo</h2>
        <Button type="primary" onClick={handleAddNotification}>Thêm Mới</Button>
      </div>

      <Table
        columns={columns}
        dataSource={notifications}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedNotification ? 'Chỉnh sửa thông báo' : 'Thêm mới thông báo'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="Loại" rules={[{ required: true, message: 'Chọn loại thông báo' }]}> 
            <Select>
              <Select.Option value="order">Đơn Hàng</Select.Option>
              <Select.Option value="payment">Thanh Toán</Select.Option>
              <Select.Option value="account">Tài Khoản</Select.Option>
              <Select.Option value="promotion">Khuyến Mãi</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Tiêu Đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="message" label="Nội Dung" rules={[{ required: true, message: 'Nhập nội dung' }]}> 
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="user" label="Người Nhận" rules={[{ required: true, message: 'Chọn người nhận' }]}> 
            <Select showSearch optionFilterProp="children" placeholder="Chọn người nhận">
              {users.map(u => (
                <Select.Option key={u._id} value={u._id}>{u.userName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isRead" label="Trạng Thái" valuePropName="checked">
            <Checkbox>Đã đọc</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
