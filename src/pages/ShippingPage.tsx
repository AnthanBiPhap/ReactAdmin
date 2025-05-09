import {
  Table,
  Space,
  Input,
  Button,
  Modal,
  Form,
  message,
  Select,
  Tag,
  DatePicker,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface Shipping {
  _id: string;
  carrier: string;
  trackingNumber?: string;
  status: 'processing' | 'shipped' | 'delivered' | 'failed';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod: string;
  shippingFee: number;
  order: string;
  createdAt: string;
  updatedAt: string;
}

interface ShippingFormValues {
  carrier: string;
  trackingNumber?: string;
  status: 'processing' | 'shipped' | 'delivered' | 'failed';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod: string;
  shippingFee: number;
  order: string;
}

const ShippingPage: React.FC = () => {
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<Shipping | null>(null);
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchShippings();
    fetchOrders();
  }, [pagination.current, pagination.pageSize]);

  const fetchShippings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/shippings', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      setShippings(response.data.data.shippings || []);
      setPagination({
        ...pagination,
        total: response.data.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi lấy danh sách vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8889/api/v1/orders');
      setOrders(response.data.data.orders || []);
    } catch (error) {
      message.error('Lỗi khi lấy danh sách đơn hàng');
    }
  };

  const handleAddShipping = () => {
    setSelectedShipping(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditShipping = (shipping: Shipping) => {
    setSelectedShipping(shipping);
    form.setFieldsValue({
      carrier: shipping.carrier,
      trackingNumber: shipping.trackingNumber,
      status: shipping.status,
      estimatedDelivery: shipping.estimatedDelivery ? new Date(shipping.estimatedDelivery) : undefined,
      actualDelivery: shipping.actualDelivery ? new Date(shipping.actualDelivery) : undefined,
      shippingMethod: shipping.shippingMethod,
      shippingFee: shipping.shippingFee,
      order: shipping.order,
    });
    setIsModalOpen(true);
  };

  const handleDeleteShipping = async (shippingId: string) => {
    try {
      await Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa vận chuyển này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
      });

      await axios.delete(`http://localhost:8889/api/v1/shippings/${shippingId}`);
      message.success('Xóa vận chuyển thành công');
      fetchShippings();
    } catch (error) {
      message.error('Lỗi khi xóa vận chuyển');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedShipping) {
        await axios.put(`http://localhost:8889/api/v1/shippings/${selectedShipping._id}`, values);
        message.success('Cập nhật vận chuyển thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/shippings', values);
        message.success('Tạo mới vận chuyển thành công');
      }

      setIsModalOpen(false);
      fetchShippings();
    } catch (error) {
      message.error('Lỗi khi xử lý vận chuyển');
    }
  };

  const columns = [
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
    },
    {
      title: 'Tracking Number',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'processing' ? 'blue' : 
          status === 'shipped' ? 'orange' : 
          status === 'delivered' ? 'green' : 
          'red'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Shipping Method',
      dataIndex: 'shippingMethod',
      key: 'shippingMethod',
    },
    {
      title: 'Shipping Fee',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      render: (fee: number) => `$${fee.toFixed(2)}`,
    },
    {
      title: 'Order Info',
      dataIndex: 'order',
      key: 'order',
      render: (orderId: string, record: Shipping) => {
        const order = orders.find(o => o._id === orderId);
        return (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {order?.orderNumber || orderId}
            </div>
            <div style={{ color: '#666' }}>
              {order?.user?.fullName || 'Unknown User'}
            </div>
            <div style={{ color: '#666' }}>
              {order?.status === 'completed' ? (
                <Tag color="green">Completed</Tag>
              ) : (
                <Tag color="blue">{order?.status || 'Pending'}</Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Estimated Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
      render: (date: Date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actual Delivery',
      dataIndex: 'actualDelivery',
      key: 'actualDelivery',
      render: (date: Date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Shipping) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditShipping(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteShipping(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Shipping Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddShipping}>
          Add Shipping
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={shippings}
        loading={loading}
        pagination={pagination}
        rowKey="_id"
        onChange={(newPagination) => {
          setPagination({
            ...pagination,
            current: newPagination.current || pagination.current,
            pageSize: newPagination.pageSize || pagination.pageSize,
          });
        }}
      />
      <Modal
        title={selectedShipping ? 'Edit Shipping' : 'Add Shipping'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="carrier"
            label="Carrier"
            rules={[{ required: true, message: 'Please enter carrier!' }, { max: 100, message: 'Maximum 100 characters!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="trackingNumber"
            label="Tracking Number"
            rules={[{ max: 100, message: 'Maximum 100 characters!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Select.Option value="processing">Processing</Select.Option>
              <Select.Option value="shipped">Shipped</Select.Option>
              <Select.Option value="delivered">Delivered</Select.Option>
              <Select.Option value="failed">Failed</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="estimatedDelivery"
            label="Estimated Delivery"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="actualDelivery"
            label="Actual Delivery"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="shippingMethod"
            label="Shipping Method"
            rules={[{ required: true, message: 'Please enter shipping method!' }, { max: 50, message: 'Maximum 50 characters!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="shippingFee"
            label="Shipping Fee"
            rules={[{ required: true, message: 'Please enter shipping fee!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="order"
            label="Order"
            rules={[{ required: true, message: 'Please select order!' }]}
          >
            <Select showSearch optionFilterProp="children">
              {orders.map((order) => (
                <Select.Option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.user?.fullName || 'Unknown User'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShippingPage;
