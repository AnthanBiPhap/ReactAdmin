import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Input, Select, Modal, Form, Checkbox } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const { Option } = Select;

interface Address {
  _id: string;
  type: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  user: {
    _id: string;
    userName: string;
    fullName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const AddressPage: React.FC = () => {
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [searchParams, setSearchParams] = useState({
    fullName: '',
    city: '',
    phoneNumber: '',
  });

  const isAdmin = user?.roles === 'admin';

  const fetchUsers = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        return;
      }
      const response = await axios.get('http://localhost:8889/api/v1/users', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      setUsers(response.data.data.users);
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else {
        message.error('Lỗi khi lấy danh sách người dùng');
      }
    }
  };

  const fetchAddresses = async (params = {}) => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/addresses', {
        params: {
          ...params,
          page: pagination.page,
          limit: pagination.limit,
        },
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      setAddresses(response.data.data.addresses);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else {
        message.error('Lỗi khi lấy danh sách địa chỉ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateAddress = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        return;
      }
      if (!isAdmin) {
        message.error('Chỉ admin mới có quyền thực hiện hành động này');
        return;
      }

      setSaving(true);
      const values = await form.validateFields();

      const data = {
        ...values,
        // user is already selected from dropdown
      };

      if (selectedAddress) {
        await axios.put(
          `http://localhost:8889/api/v1/addresses/${selectedAddress._id}`,
          data,
          {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          }
        );
        message.success('Cập nhật địa chỉ thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/addresses', data, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Tạo mới địa chỉ thành công');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchAddresses(searchParams);
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        message.error('Bạn không có quyền thực hiện hành động này');
      } else {
        console.error('Error:', error.response?.data);
        message.error('Lỗi khi xử lý địa chỉ');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          if (!tokens?.accessToken) {
            message.error('Vui lòng đăng nhập để tiếp tục');
            return;
          }
          if (!isAdmin) {
            message.error('Chỉ admin mới có quyền xóa');
            return;
          }

          await axios.delete(`http://localhost:8889/api/v1/addresses/${addressId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa địa chỉ thành công');
          fetchAddresses(searchParams);
        } catch (error: any) {
          if (error.response?.status === 401) {
            message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
          } else if (error.response?.status === 403) {
            message.error('Bạn không có quyền xóa');
          } else {
            message.error('Lỗi khi xóa địa chỉ');
          }
        }
      },
    });
  };

  const handleAddAddress = () => {
    setSelectedAddress(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress(address);
    form.setFieldsValue({
      ...address,
      user: address.user?._id || undefined,
      isDefault: address.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchAddresses(searchParams);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  useEffect(() => {
    fetchUsers();
  }, [tokens?.accessToken]);

  useEffect(() => {
    fetchAddresses(searchParams);
  }, [pagination.page, pagination.limit, tokens?.accessToken]);

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      sorter: (a: Address, b: Address) => a.type.localeCompare(b.type),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 150,
      sorter: (a: Address, b: Address) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 120,
    },
    {
      title: 'Address Line 1',
      dataIndex: 'addressLine1',
      key: 'addressLine1',
      width: 200,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      sorter: (a: Address, b: Address) => a.city.localeCompare(b.city),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: 'Is Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 100,
      render: (isDefault: boolean) => (isDefault ? 'Yes' : 'No'),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 150,
      render: (user: any) => (
        <span>{user ? `${user.fullName} (${user.userName})` : 'Unknown'}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_: any, record: Address) =>
        isAdmin ? (
          <Space size="middle">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditAddress(record)}
            >
              Sửa
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAddress(record._id)}
            >
              Xóa
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Addresses</h1>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAddress}>
            Thêm Địa Chỉ
          </Button>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Input
            placeholder="Tìm kiếm theo Full Name"
            value={searchParams.fullName}
            onChange={(e) => setSearchParams({ ...searchParams, fullName: e.target.value })}
            allowClear
            style={{ width: 200 }}
          />
          <Input
            placeholder="Tìm kiếm theo City"
            value={searchParams.city}
            onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
            allowClear
            style={{ width: 200 }}
          />
          <Input
            placeholder="Tìm kiếm theo Phone Number"
            value={searchParams.phoneNumber}
            onChange={(e) => setSearchParams({ ...searchParams, phoneNumber: e.target.value })}
            allowClear
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </Space>
      </div>

      <Table
        dataSource={addresses}
        columns={columns}
        loading={loading}
        rowKey="_id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.totalRecord,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={selectedAddress ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ'}
        open={isModalOpen}
        onOk={handleCreateOrUpdateAddress}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okButtonProps={{ loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'shipping', country: 'VN', isDefault: false }}
        >
          <Form.Item
            name="user"
            label="User"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
          >
            <Select showSearch optionFilterProp="children" placeholder="Chọn người dùng">
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName} ({u.userName})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ!' }]}
          >
            <Select>
              <Option value="shipping">Shipping</Option>
              <Option value="billing">Billing</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên!' },
              { max: 100, message: 'Tên tối đa 100 ký tự!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { max: 20, message: 'Số điện thoại tối đa 20 ký tự!' },
              { pattern: /^\d+$/, message: 'Số điện thoại chỉ chứa số!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="addressLine1"
            label="Address Line 1"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ!' },
              { max: 255, message: 'Địa chỉ tối đa 255 ký tự!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="addressLine2"
            label="Address Line 2"
            rules={[{ max: 255, message: 'Địa chỉ tối đa 255 ký tự!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="City"
            rules={[
              { required: true, message: 'Vui lòng nhập thành phố!' },
              { max: 100, message: 'Thành phố tối đa 100 ký tự!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="state"
            label="State"
            rules={[{ max: 100, message: 'Tiểu bang tối đa 100 ký tự!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="postalCode"
            label="Postal Code"
            rules={[{ max: 20, message: 'Mã bưu điện tối đa 20 ký tự!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="country"
            label="Country"
            rules={[
              { required: true, message: 'Vui lòng chọn quốc gia!' },
              { max: 2, message: 'Mã quốc gia tối đa 2 ký tự!' },
            ]}
          >
            <Select>
              <Option value="VN">Vietnam</Option>
              <Option value="US">United States</Option>
              <Option value="JP">Japan</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="isDefault"
            label="Is Default"
            valuePropName="checked"
          >
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressPage;