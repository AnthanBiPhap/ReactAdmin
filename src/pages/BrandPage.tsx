import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Brand {
  _id: string;
  brand_name: string;
  description: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const BrandPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchBrands();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchBrands = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/brands', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      // Kiểm tra cấu trúc response
      console.log('API Response:', response.data);
      
      // Dữ liệu thương hiệu nằm trong data.brands
      setBrands(response.data.data.brands || []);
      setPagination({
        ...pagination,
        totalRecord: response.data.data.pagination?.totalRecord || 0,
      });
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách thương hiệu');
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

  const handleAddBrand = () => {
    setSelectedBrand(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    form.setFieldsValue({
      brand_name: brand.brand_name,
      description: brand.description,
      slug: brand.slug,
    });
    setIsModalOpen(true);
  };

  const handleDeleteBrand = (brandId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thương hiệu này?',
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
          await axios.delete(`http://localhost:8889/api/v1/brands/${brandId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa thương hiệu thành công');
          fetchBrands();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa thương hiệu');
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

      let response;
      if (selectedBrand) {
        response = await axios.put(
          `http://localhost:8889/api/v1/brands/${selectedBrand._id}`,
          values,
          {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          }
        );
        message.success('Cập nhật thương hiệu thành công');
      } else {
        response = await axios.post(
          'http://localhost:8889/api/v1/brands',
          values,
          {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          }
        );
        message.success('Tạo mới thương hiệu thành công');
      }

      // Kiểm tra response
      console.log('API Response:', response.data);
      
      // Cập nhật state với dữ liệu mới
      if (response.data.data) {
        if (selectedBrand) {
          // Cập nhật thương hiệu hiện tại
          const updatedBrand = response.data.data;
          const updatedBrands = brands.map(brand => 
            brand._id === selectedBrand._id ? updatedBrand : brand
          );
          setBrands(updatedBrands);
        } else {
          // Thêm thương hiệu mới
          setBrands([...brands, response.data.data]);
        }
      }

      setIsModalOpen(false);
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý thương hiệu');
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
    { title: 'Tên Thương Hiệu', dataIndex: 'brand_name', key: 'brand_name' },
    { title: 'Mô Tả', dataIndex: 'description', key: 'description' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Brand) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditBrand(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBrand(record._id)}
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
          onClick={handleAddBrand}
        >
          Thêm Thương Hiệu
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={brands}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm mới thương hiệu'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="brand_name"
            label="Tên Thương Hiệu"
            rules={[
              { required: true, message: 'Vui lòng nhập tên thương hiệu' },
              { min: 2, message: 'Tên thương hiệu phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Tên thương hiệu không được vượt quá 50 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả"
            rules={[
              { required: true, message: 'Vui lòng nhập mô tả' },
              { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Vui lòng nhập slug' },
              { min: 2, message: 'Slug phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Slug không được vượt quá 50 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandPage;
