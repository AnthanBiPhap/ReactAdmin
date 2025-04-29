import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Upload, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Category {
  _id: string;
  category_name: string;
  description: string;
  slug: string;
  level: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchCategories();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchCategories = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/categories', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setCategories(response.data.data.categories);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách danh mục');
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

  const handleAddCategory = () => {
    setSelectedCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    form.setFieldsValue({
      category_name: category.category_name,
      description: category.description,
      slug: category.slug,
      level: category.level,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa danh mục này?',
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
          await axios.delete(`http://localhost:8889/api/v1/categories/${categoryId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa danh mục thành công');
          fetchCategories();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa danh mục');
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

      if (selectedCategory) {
        await axios.put(`http://localhost:8889/api/v1/categories/${selectedCategory._id}`, values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật danh mục thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/categories', values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới danh mục thành công');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý danh mục');
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
    { title: 'Tên Danh Mục', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Mô Tả', dataIndex: 'description', key: 'description' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { 
      title: 'Level', 
      dataIndex: 'level', 
      key: 'level',
      render: (level: number) => level.toString()
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive: boolean) => isActive ? 'Hoạt động' : 'Không hoạt động'
    },
    { 
      title: 'Ảnh', 
      dataIndex: 'imageUrl', 
      key: 'imageUrl',
      render: (imageUrl: string) => (
        <Image 
          src={imageUrl} 
          width={50} 
          height={50} 
          preview={{ visible: false }} 
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditCategory(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCategory(record._id)}
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
          onClick={handleAddCategory}
        >
          Thêm Mới Danh Mục
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category_name"
            label="Tên Danh Mục"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục' },
              { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Tên danh mục không được vượt quá 50 ký tự' },
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

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Vui lòng nhập level' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Ảnh Đại Diện"
            rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng Thái"
          >
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryPage;
