import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Payment {
  _id: string;
  amount: number;
  method: 'credit_card' | 'paypal' | 'cod';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  gateway: string;
  metadata: any;
  order: {
    _id: string;
    orderNumber: string;
  };
  user: {
    _id: string;
    userName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [users, setUsers] = useState<{ _id: string; userName: string }[]>([]);
  const [orders, setOrders] = useState<{ _id: string; orderNumber: string }[]>([]);
  const [customMetadata, setCustomMetadata] = useState('');
  const [metadataMode, setMetadataMode] = useState<'select'|'custom'>('select');

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchPayments();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchPayments = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/payments', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách thanh toán');
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

  const fetchUsers = async () => {
    try {
      if (!tokens?.accessToken) return;
      const res = await axios.get('http://localhost:8889/api/v1/users', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: 1, limit: 100 },
      });
      setUsers(res.data.data.users);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      if (!tokens?.accessToken) return;
      const res = await axios.get('http://localhost:8889/api/v1/orders', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: 1, limit: 100 },
      });
      setOrders(res.data.data.orders);
    } catch {}
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    form.resetFields();
    setMetadataMode('select');
    setCustomMetadata('');
    form.setFieldsValue({ metadata: JSON.stringify({}) });
    fetchUsers();
    fetchOrders();
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    let metaStr = payment.metadata ? JSON.stringify(payment.metadata) : JSON.stringify({});
    const preset = [JSON.stringify({}), JSON.stringify({ fast: true }), JSON.stringify({ refunded: true }), JSON.stringify({ note: 'Khách VIP' })];
    if (!preset.includes(metaStr)) {
      setMetadataMode('custom');
      setCustomMetadata(metaStr);
      form.setFieldsValue({ metadata: metaStr });
    } else {
      setMetadataMode('select');
      setCustomMetadata('');
      form.setFieldsValue({ metadata: metaStr });
    }
    form.setFieldsValue({
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      gateway: payment.gateway,
      user: payment.user?._id || '',
      order: payment.order?._id || '',
    });
    fetchUsers();
    fetchOrders();
    setIsModalOpen(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thanh toán này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          if (!tokens?.accessToken) {
            message.error('Vui lòng đăng nhập để tiếp tục');
            navigate('/login');
            return;
          }

          setLoading(true);
          await axios.delete(`http://localhost:8889/api/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa thanh toán thành công');
          fetchPayments();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa thanh toán');
        } finally {
          setLoading(false);
        }
      },
    });
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
      let metadata = metadataMode === 'custom' ? customMetadata : values.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = metadata ? JSON.parse(metadata) : {};
        } catch {
          metadata = {};
        }
      }
      const payload = { ...values, metadata, user: values.user, order: values.order };

      if (selectedPayment) {
        await axios.put(`http://localhost:8889/api/v1/payments/${selectedPayment._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật thanh toán thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/payments', payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới thanh toán thành công');
      }

      setIsModalOpen(false);
      fetchPayments();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý thanh toán');
    } finally {
      setSaving(false);
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
      title: 'Mã Giao Dịch',
      dataIndex: 'transactionId',
      key: 'transactionId',
    },
    {
      title: 'Số Tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span>{amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>,
    },
    {
      title: 'Phương Thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => {
        const methodMap: { [key: string]: { color: string; label: string } } = {
          'credit_card': { color: '#1890ff', label: 'Thẻ Tín Dụng' },
          'paypal': { color: '#2db7f5', label: 'PayPal' },
          'cod': { color: '#87d068', label: 'COD' }
        };
        return <Tag color={methodMap[method]?.color}>{methodMap[method]?.label}</Tag>;
      }
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: { [key: string]: { color: string; label: string } } = {
          'pending': { color: '#108ee9', label: 'Chờ Xử Lý' },
          'completed': { color: '#52c41a', label: 'Hoàn Thành' },
          'failed': { color: '#f5222d', label: 'Thất Bại' },
          'refunded': { color: '#faad14', label: 'Hoàn Trả' }
        };
        return <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>;
      }
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
    },
    {
      title: 'Đơn Hàng',
      dataIndex: ['order', 'orderNumber'],
      key: 'order',
    },
    {
      title: 'Người Dùng',
      dataIndex: ['user', 'userName'],
      key: 'user',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Payment) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditPayment(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePayment(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddPayment}
        >
          Thêm Mới Thanh Toán
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={payments}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedPayment ? 'Chỉnh sửa thanh toán' : 'Thêm mới thanh toán'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="amount"
            label="Số Tiền"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <Input type="number" prefix={<DollarOutlined />} />
          </Form.Item>

          <Form.Item
            name="method"
            label="Phương Thức Thanh Toán"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
          >
            <Select options={[
              { value: 'credit_card', label: 'Thẻ Tín Dụng' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'cod', label: 'COD' }
            ]} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng Thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select options={[
              { value: 'pending', label: 'Chờ Xử Lý' },
              { value: 'completed', label: 'Hoàn Thành' },
              { value: 'failed', label: 'Thất Bại' },
              { value: 'refunded', label: 'Hoàn Trả' }
            ]} />
          </Form.Item>

          <Form.Item
            name="transactionId"
            label="Mã Giao Dịch"
            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="gateway"
            label="Gateway"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="metadata"
            label="Điều Kiện Khác"
            rules={[{ required: false }]}
          >
            {metadataMode === 'select' ? (
              <Select
                onChange={val => {
                  if (val === '__custom__') setMetadataMode('custom');
                  else form.setFieldsValue({ metadata: val });
                }}
                placeholder="Chọn điều kiện hoặc tùy chỉnh"
                defaultValue={''}
              >
                <Select.Option value={JSON.stringify({})}>Không có</Select.Option>
                <Select.Option value={JSON.stringify({ fast: true })}>Thanh toán nhanh</Select.Option>
                <Select.Option value={JSON.stringify({ refunded: true })}>Đã hoàn trả</Select.Option>
                <Select.Option value={JSON.stringify({ note: 'Khách VIP' })}>Ghi chú đặc biệt</Select.Option>
                <Select.Option value="__custom__">Tùy chỉnh...</Select.Option>
              </Select>
            ) : (
              <Input.TextArea
                rows={4}
                placeholder="Nhập JSON cho metadata"
                value={customMetadata}
                onChange={e => setCustomMetadata(e.target.value)}
                onBlur={() => form.setFieldsValue({ metadata: customMetadata })}
              />
            )}
          </Form.Item>

          <Form.Item
            name="user"
            label="Người Dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Chọn người dùng"
              filterOption={(input, option) =>
                String(option?.children).toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map(u => (
                <Select.Option key={u._id} value={u._id}>{u.userName}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="order"
            label="Đơn Hàng"
            rules={[{ required: true, message: 'Vui lòng chọn đơn hàng' }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Chọn đơn hàng"
              filterOption={(input, option) =>
                String(option?.children).toLowerCase().includes(input.toLowerCase())
              }
            >
              {orders.map(o => (
                <Select.Option key={o._id} value={o._id}>{o.orderNumber}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
