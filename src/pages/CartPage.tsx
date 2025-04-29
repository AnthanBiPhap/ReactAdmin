import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Cart {
  _id: string;
  items: Array<{
    productId: string;
    quantity: number;
    name: string;
    price: number;
  }>;
  totalAmount: number;
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

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [carts, setCarts] = useState<Cart[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductKeys, setSelectedProductKeys] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchCarts();
    fetchUsers();
    fetchProducts();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  useEffect(() => {
    // Tự động cập nhật tổng tiền khi sản phẩm hoặc số lượng thay đổi
    const total = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    form.setFieldsValue({ totalAmount: total });
  }, [selectedProducts, form]);

  const fetchCarts = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/carts', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setCarts(response.data.data.carts);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8889/api/v1/users', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      setUsers(response.data.data.users);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách người dùng');
    }
  };

  const fetchProducts = async () => {
    try {
      if (!tokens?.accessToken) return;
      const response = await axios.get('http://localhost:8889/api/v1/products', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      setProducts(response.data.data.products);
    } catch (error) {
      message.error('Lỗi khi lấy danh sách sản phẩm');
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

  const handleAddCart = () => {
    setSelectedCart(null);
    form.resetFields();
    setSelectedProductKeys([]);
    setSelectedProducts([]);
    setIsModalOpen(true);
  };

  const handleEditCart = (cart: Cart) => {
    setSelectedCart(cart);
    form.setFieldsValue({
      user: cart.user._id,
      totalAmount: cart.totalAmount,
    });
    setSelectedProductKeys(cart.items.map(item => item.productId));
    setSelectedProducts(cart.items.map(item => ({
      key: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })));
    setIsModalOpen(true);
  };

  const handleDeleteCart = (cartId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa giỏ hàng này?',
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
          await axios.delete(`http://localhost:8889/api/v1/carts/${cartId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa giỏ hàng thành công');
          fetchCarts();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa giỏ hàng');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleProductSelectChange = (selectedRowKeys: React.Key[], selectedRows: any[]) => {
    const newSelectedProducts = selectedRows.map(row => {
      const existed = selectedProducts.find(p => p.productId === row._id);
      return {
        key: row._id,
        productId: row._id,
        name: row.product_name,
        price: row.price,
        quantity: existed ? existed.quantity : 1
      };
    });
    setSelectedProductKeys(selectedRowKeys as string[]);
    setSelectedProducts(newSelectedProducts);
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev => prev.map(p => p.productId === productId ? { ...p, quantity } : p));
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

      if (selectedProducts.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một sản phẩm');
      }
      for (const p of selectedProducts) {
        if (!p.quantity || p.quantity <= 0) {
          throw new Error(`Số lượng sản phẩm "${p.name}" phải lớn hơn 0`);
        }
      }

      const calculatedTotal = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = parseFloat(values.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error('Tổng tiền phải là số dương');
      }
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        throw new Error('Tổng tiền không khớp với tổng giá trị các sản phẩm');
      }

      const items = selectedProducts.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        name: p.name,
        price: p.price
      }));

      const data = {
        user: values.user,
        items,
        totalAmount
      };

      if (selectedCart) {
        await axios.put(`http://localhost:8889/api/v1/carts/${selectedCart._id}`, data, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Cập nhật giỏ hàng thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/carts', data, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Tạo mới giỏ hàng thành công');
      }

      setIsModalOpen(false);
      fetchCarts();
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message) {
        message.error(error.message);
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Lỗi khi xử lý giỏ hàng');
      }
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
    { title: 'Người Dùng', dataIndex: ['user', 'userName'], key: 'user' },
    { 
      title: 'Sản Phẩm', 
      dataIndex: 'items', 
      key: 'items',
      render: (items: any) => items.map((item: any) => `${item.name} x ${item.quantity}`).join(', ') 
    },
    { title: 'Tổng Tiền', dataIndex: 'totalAmount', key: 'totalAmount' },
    { title: 'Ngày Tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Cart) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditCart(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCart(record._id)}
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
          onClick={handleAddCart}
        >
          Thêm Mới Giỏ Hàng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={carts}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedCart ? 'Chỉnh sửa giỏ hàng' : 'Thêm mới giỏ hàng'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="user"
            label="Người Dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
          >
            <Select
              disabled={!!selectedCart}
              placeholder="Chọn người dùng"
              options={users.map(user => ({
                value: user._id,
                label: `${user.fullName} (${user.userName})`
              }))}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <b>Chọn sản phẩm</b>
            <Table
              rowKey="_id"
              dataSource={products}
              columns={[
                { title: 'Tên sản phẩm', dataIndex: 'product_name', key: 'name' },
                { title: 'Giá', dataIndex: 'price', key: 'price' },
                {
                  title: 'Số lượng',
                  key: 'quantity',
                  render: (_, record) => {
                    const selected = selectedProducts.find(p => p.productId === record._id);
                    return selected ? (
                      <InputNumber
                        min={1}
                        value={selected.quantity}
                        onChange={val => handleProductQuantityChange(record._id, val || 1)}
                        style={{ width: 80 }}
                      />
                    ) : null;
                  },
                },
              ]}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedProductKeys,
                onChange: handleProductSelectChange,
                getCheckboxProps: (record) => ({ disabled: false })
              }}
              pagination={false}
              size="small"
            />
          </div>

          <Form.Item
            name="totalAmount"
            label="Tổng Tiền"
            rules={[{ required: true, message: 'Vui lòng nhập tổng tiền' }]}
          >
            <Input
              type="number"
              min={0}
              addonAfter="VND"
              style={{ width: '100%' }}
              readOnly
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CartPage;
