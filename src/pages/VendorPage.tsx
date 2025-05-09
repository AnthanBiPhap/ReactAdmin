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
  InputNumber,
  Upload,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface Vendor {
  _id: string;
  companyName: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    country: string;
    postalCode: string;
  };
  contactPhone: string;
  contactEmail: string;
  website?: string;
  socialLinks: Record<string, string>;
  rating: number;
  status: 'pending' | 'active' | 'suspended';
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface VendorFormValues {
  companyName: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    country: string;
    postalCode: string;
  };
  contactPhone: string;
  contactEmail: string;
  website?: string;
  socialLinks: Record<string, string>;
  rating: number;
  status: 'pending' | 'active' | 'suspended';
  user: string;
}

const VendorPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/vendors', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      setVendors(response.data.data.vendors || []);
      setPagination({
        ...pagination,
        total: response.data.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi lấy danh sách nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8889/api/v1/users');
      setUsers(response.data.data.users || []);
    } catch (error) {
      message.error('Lỗi khi lấy danh sách người dùng');
    }
  };

  const handleAddVendor = () => {
    setSelectedVendor(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    form.setFieldsValue({
      companyName: vendor.companyName,
      description: vendor.description,
      logoUrl: vendor.logoUrl,
      coverImageUrl: vendor.coverImageUrl,
      address: vendor.address,
      contactPhone: vendor.contactPhone,
      contactEmail: vendor.contactEmail,
      website: vendor.website,
      socialLinks: vendor.socialLinks,
      rating: vendor.rating,
      status: vendor.status,
      user: vendor.user,
    });
    setIsModalOpen(true);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa nhà cung cấp này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
      });

      await axios.delete(`http://localhost:8889/api/v1/vendors/${vendorId}`);
      message.success('Xóa nhà cung cấp thành công');
      fetchVendors();
    } catch (error) {
      message.error('Lỗi khi xóa nhà cung cấp');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedVendor) {
        await axios.put(`http://localhost:8889/api/v1/vendors/${selectedVendor._id}`, values);
        message.success('Cập nhật nhà cung cấp thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/vendors', values);
        message.success('Tạo mới nhà cung cấp thành công');
      }

      setIsModalOpen(false);
      fetchVendors();
    } catch (error) {
      message.error('Lỗi khi xử lý nhà cung cấp');
    }
  };

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Logo',
      dataIndex: 'logoUrl',
      key: 'logoUrl',
      render: (logo: string) => logo ? (
        <img src={logo} alt="Logo" style={{ width: 50, height: 50 }} />
      ) : (
        <Tag color="warning">No Logo</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'active' ? 'green' : 
          status === 'pending' ? 'blue' : 
          'red'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => `${rating}/5`,
    },
    {
      title: 'Contact',
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      render: (email: string, record: Vendor) => (
        <div>
          <div>{record.contactPhone}</div>
          <div style={{ color: '#666' }}>{email}</div>
        </div>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address: any) => (
        <div>
          <div>{address.street}</div>
          <div style={{ color: '#666' }}>
            {address.ward}, {address.district}, {address.city}
          </div>
        </div>
      ),
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
      render: (_: any, record: Vendor) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditVendor(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteVendor(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Vendor Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVendor}>
          Add Vendor
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={vendors}
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
        title={selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name!' }, { max: 100, message: 'Maximum 100 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="Contact Phone"
                rules={[{ required: true, message: 'Please enter contact phone!' }, { max: 20, message: 'Maximum 20 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactEmail"
                label="Contact Email"
                rules={[{ required: true, message: 'Please enter contact email!' }, { type: 'email', message: 'Please enter a valid email!' }, { max: 100, message: 'Maximum 100 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="website"
                label="Website"
                rules={[{ max: 255, message: 'Maximum 255 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 1000, message: 'Maximum 1000 characters!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="logoUrl"
                label="Logo URL"
                rules={[{ max: 255, message: 'Maximum 255 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="coverImageUrl"
                label="Cover Image URL"
                rules={[{ max: 255, message: 'Maximum 255 characters!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name={['address', 'street']}
                  label="Street"
                  rules={[{ required: true, message: 'Please enter street!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['address', 'ward']}
                  label="Ward"
                  rules={[{ required: true, message: 'Please enter ward!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['address', 'district']}
                  label="District"
                  rules={[{ required: true, message: 'Please enter district!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['address', 'city']}
                  label="City"
                  rules={[{ required: true, message: 'Please enter city!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rating"
                label="Rating"
                rules={[{ required: true, message: 'Please enter rating!' }, { type: 'number', min: 0, max: 5, message: 'Rating must be between 0 and 5!' }]}
              >
                <InputNumber min={0} max={5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="suspended">Suspended</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="user"
            label="User"
            rules={[{ required: true, message: 'Please select user!' }]}
          >
            <Select showSearch optionFilterProp="children">
              {users.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.fullName || user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorPage;
