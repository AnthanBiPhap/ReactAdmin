import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Location {
  _id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const LocationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchLocations();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchLocations = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/locations', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setLocations(response.data.data.locations);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách địa điểm');
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

  const handleAddLocation = () => {
    setSelectedLocation(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    form.setFieldsValue({
      name: location.name,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      country: location.country,
      isActive: location.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa địa điểm này?',
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
          await axios.delete(`http://localhost:8889/api/v1/locations/${locationId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa địa điểm thành công');
          fetchLocations();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa địa điểm');
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

      if (selectedLocation) {
        await axios.put(`http://localhost:8889/api/v1/locations/${selectedLocation._id}`, values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật địa điểm thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/locations', values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới địa điểm thành công');
      }

      setIsModalOpen(false);
      fetchLocations();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý địa điểm');
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
    { title: 'Tên Địa Điểm', dataIndex: 'name', key: 'name' },
    { 
      title: 'Địa Chỉ', 
      dataIndex: 'addressLine1', 
      key: 'addressLine1',
      render: (addressLine1: string, record: Location) => 
        `${addressLine1}${record.addressLine2 ? ', ' + record.addressLine2 : ''}`
    },
    { 
      title: 'Thành Phố', 
      dataIndex: 'city', 
      key: 'city'
    },
    { 
      title: 'Tỉnh/Thành', 
      dataIndex: 'state', 
      key: 'state'
    },
    { 
      title: 'Mã Bưu Chính', 
      dataIndex: 'postalCode', 
      key: 'postalCode'
    },
    { 
      title: 'Quốc Gia', 
      dataIndex: 'country', 
      key: 'country'
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive: boolean) => isActive ? 'Hoạt động' : 'Không hoạt động'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Location) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditLocation(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteLocation(record._id)}
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
          onClick={handleAddLocation}
        >
          Thêm Mới Địa Điểm
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={locations}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedLocation ? 'Chỉnh sửa địa điểm' : 'Thêm mới địa điểm'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên Địa Điểm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên địa điểm' },
              { min: 1, message: 'Tên địa điểm phải có ít nhất 1 ký tự' },
              { max: 100, message: 'Tên địa điểm không được vượt quá 100 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="addressLine1"
            label="Địa Chỉ 1"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ 1' },
              { max: 255, message: 'Địa chỉ không được vượt quá 255 ký tự' },
            ]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="addressLine2"
            label="Địa Chỉ 2"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="city"
            label="Thành Phố"
            rules={[
              { required: true, message: 'Vui lòng nhập thành phố' },
              { max: 100, message: 'Tên thành phố không được vượt quá 100 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="state"
            label="Tỉnh/Thành"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="postalCode"
            label="Mã Bưu Chính"
            rules={[
              { required: true, message: 'Vui lòng nhập mã bưu chính' },
              { max: 20, message: 'Mã bưu chính không được vượt quá 20 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="country"
            label="Quốc Gia"
            rules={[
              { required: true, message: 'Vui lòng nhập quốc gia' },
              { max: 100, message: 'Tên quốc gia không được vượt quá 100 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng Thái"
            valuePropName="checked"
          >
            <Checkbox>Hoạt động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationPage;
