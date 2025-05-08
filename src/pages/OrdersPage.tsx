import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Product {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  products: Product[];
  totalAmount: number;
  shippingFee: number;
  tax: number;
  discount: number;
  paymentMethod: 'credit_card' | 'paypal' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

interface ProductApi {
  _id: string;
  name: string;
  price: number;
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [allProducts, setAllProducts] = useState<ProductApi[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchOrders();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchOrders = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/orders', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách đơn hàng');
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

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchProducts();
    setSelectedProducts(order.products);
    form.setFieldsValue({
      orderNumber: order.orderNumber,
      products: order.products.map(p => p.productId),
      totalAmount: order.totalAmount,
      shippingFee: order.shippingFee,
      tax: order.tax,
      discount: order.discount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      shippingAddress: order.shippingAddress,
    });
    setIsModalOpen(true);
  };

  const fetchProducts = async () => {
    try {
      if (!tokens?.accessToken) return;
      const response = await axios.get('http://localhost:8889/api/v1/products', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { limit: 1000 },
      });
      setAllProducts(response.data.data.products || []);
    } catch {}
  };

  const handleDeleteOrder = (orderId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa đơn hàng này?',
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
          await axios.delete(`http://localhost:8889/api/v1/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa đơn hàng thành công');
          fetchOrders();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa đơn hàng');
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

      const products = selectedProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      }));
      const payload = {
        ...values,
        products,
        totalAmount: products.reduce((acc, p) => acc + p.price * p.quantity, 0),
      };

      if (selectedOrder) {
        await axios.put(`http://localhost:8889/api/v1/orders/${selectedOrder._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Cập nhật đơn hàng thành công');
      }

      setIsModalOpen(false);
      fetchOrders();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý đơn hàng');
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
      title: 'Mã Đơn Hàng', 
      dataIndex: 'orderNumber', 
      key: 'orderNumber'
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'products',
      key: 'products',
      render: (products: Product[]) =>
        products && products.length
          ? products.map(p => `${p.name} (x${p.quantity})`).join(', ')
          : ''
    },
    { 
      title: 'Tổng Tiền', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount',
      render: (totalAmount: number) => (
        <span style={{ color: '#1890ff' }}>
          {totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
        </span>
      )
    },
    { 
      title: 'Phương Thức Thanh Toán', 
      dataIndex: 'paymentMethod', 
      key: 'paymentMethod',
      render: (paymentMethod: string) => {
        const methodMap: { [key: string]: { color: string; label: string } } = {
          'credit_card': { color: '#1890ff', label: 'Thẻ Tín Dụng' },
          'paypal': { color: '#2db7f5', label: 'PayPal' },
          'cod': { color: '#87d068', label: 'COD' }
        };
        return <span style={{ color: methodMap[paymentMethod]?.color }}>{methodMap[paymentMethod]?.label}</span>;
      }
    },
    { 
      title: 'Trạng Thái Thanh Toán', 
      dataIndex: 'paymentStatus', 
      key: 'paymentStatus',
      render: (paymentStatus: string) => {
        const statusMap: { [key: string]: { color: string; label: string } } = {
          'pending': { color: '#108ee9', label: 'Chờ Thanh Toán' },
          'paid': { color: '#52c41a', label: 'Đã Thanh Toán' },
          'failed': { color: '#f5222d', label: 'Thất Bại' }
        };
        return <span style={{ color: statusMap[paymentStatus]?.color }}>{statusMap[paymentStatus]?.label}</span>;
      }
    },
    { 
      title: 'Trạng Thái Đơn Hàng', 
      dataIndex: 'orderStatus', 
      key: 'orderStatus',
      render: (orderStatus: string) => {
        const statusMap: { [key: string]: { color: string; label: string } } = {
          'pending': { color: '#108ee9', label: 'Chờ Xử Lý' },
          'processing': { color: '#1890ff', label: 'Đang Xử Lý' },
          'shipped': { color: '#2db7f5', label: 'Đang Giao' },
          'delivered': { color: '#52c41a', label: 'Đã Giao' },
          'cancelled': { color: '#f5222d', label: 'Đã Hủy' }
        };
        return <span style={{ color: statusMap[orderStatus]?.color }}>{statusMap[orderStatus]?.label}</span>;
      }
    },
    { 
      title: 'Địa Chỉ Giao Hàng', 
      dataIndex: 'shippingAddress', 
      key: 'shippingAddress',
      render: (address: any) => 
        `${address.fullName}\n${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}\n${address.city}, ${address.state} ${address.postalCode}\n${address.country}`
    },
    { 
      title: 'Ngày Tạo', 
      dataIndex: 'createdAt', 
      key: 'createdAt'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditOrder(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteOrder(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={'Chỉnh sửa đơn hàng'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderNumber"
            label="Mã Đơn Hàng"
            rules={[
              { required: true, message: 'Vui lòng nhập mã đơn hàng' },
              { min: 1, message: 'Mã đơn hàng phải có ít nhất 1 ký tự' },
              { max: 50, message: 'Mã đơn hàng không được vượt quá 50 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="products"
            label="Sản Phẩm"
            rules={[
              { required: true, message: 'Vui lòng thêm sản phẩm' },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn sản phẩm"
              value={selectedProducts.map(p => p.productId)}
              onChange={(productIds: string[]) => {
                const newSelected = productIds.map(pid => {
                  const existed = selectedProducts.find(p => p.productId === pid);
                  const prod = allProducts.find(p => p._id === pid);
                  return existed || (prod ? {
                    productId: prod._id,
                    name: prod.name,
                    price: prod.price,
                    quantity: 1
                  } : null);
                }).filter(Boolean) as Product[];
                setSelectedProducts(newSelected);
              }}
              optionLabelProp="label"
            >
              {allProducts.map(p => (
                <Select.Option key={p._id} value={p._id} label={p.name}>{p.name}</Select.Option>
              ))}
            </Select>
            {selectedProducts.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {selectedProducts.map((p, idx) => (
                  <div key={p.productId} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ flex: 1 }}>{p.name}:</span>
                    <InputNumber
                      min={1}
                      value={p.quantity}
                      onChange={val => {
                        const newArr = [...selectedProducts];
                        newArr[idx].quantity = val || 1;
                        setSelectedProducts(newArr);
                      }}
                      style={{ width: 100, marginLeft: 8 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="Tổng Tiền"
            rules={[
              { required: true, message: 'Vui lòng nhập tổng tiền' },
              { min: 0, message: 'Tổng tiền phải lớn hơn 0' },
            ]}
          >
            <Input value={selectedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0)} readOnly style={{ color: '#1890ff' }} />
          </Form.Item>

          <Form.Item
            name="shippingFee"
            label="Phí Vận Chuyển"
            rules={[
              { required: true, message: 'Vui lòng nhập phí vận chuyển' },
              { min: 0, message: 'Phí vận chuyển phải lớn hơn 0' },
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="tax"
            label="Thuế"
            rules={[
              { required: true, message: 'Vui lòng nhập thuế' },
              { min: 0, message: 'Thuế phải lớn hơn 0' },
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="discount"
            label="Giảm Giá"
            rules={[
              { required: true, message: 'Vui lòng nhập giảm giá' },
              { min: 0, message: 'Giảm giá phải lớn hơn 0' },
            ]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
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
            name="paymentStatus"
            label="Trạng Thái Thanh Toán"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
          >
            <Select options={[
              { value: 'pending', label: 'Chờ Thanh Toán' },
              { value: 'paid', label: 'Đã Thanh Toán' },
              { value: 'failed', label: 'Thất Bại' }
            ]} />
          </Form.Item>

          <Form.Item
            name="orderStatus"
            label="Trạng Thái Đơn Hàng"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái đơn hàng' }]}
          >
            <Select options={[
              { value: 'pending', label: 'Chờ Xử Lý' },
              { value: 'processing', label: 'Đang Xử Lý' },
              { value: 'shipped', label: 'Đang Giao' },
              { value: 'delivered', label: 'Đã Giao' },
              { value: 'cancelled', label: 'Đã Hủy' }
            ]} />
          </Form.Item>

          <Form.Item
            name="shippingAddress"
            label="Địa Chỉ Giao Hàng"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
          >
            <Form.Item
              name="shippingAddress.fullName"
              label="Họ Tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="shippingAddress.addressLine1"
              label="Địa Chỉ 1"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ 1' }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              name="shippingAddress.addressLine2"
              label="Địa Chỉ 2"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              name="shippingAddress.city"
              label="Thành Phố"
              rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="shippingAddress.state"
              label="Tỉnh/Thành"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="shippingAddress.postalCode"
              label="Mã Bưu Chính"
              rules={[{ required: true, message: 'Vui lòng nhập mã bưu chính' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="shippingAddress.country"
              label="Quốc Gia"
              rules={[{ required: true, message: 'Vui lòng nhập quốc gia' }]}
            >
              <Input />
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;