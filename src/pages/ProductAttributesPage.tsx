import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, Checkbox, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined, SwapOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/es/table/interface';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface ProductAttribute {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  isFilterable: boolean;
  isVariant: boolean;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  productsCount: number; // Số lượng sản phẩm sử dụng thuộc tính
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const ProductAttributesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
  const [searchText, setSearchText] = useState('');

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchProductAttributes();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchProductAttributes = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchText
      };

      const response = await axios.get('http://localhost:8889/api/v1/productattributes', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params,
      });

      setProductAttributes(response.data.data.productAttributes);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách thuộc tính sản phẩm');
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchText(value);

    const timer = setTimeout(() => {
      fetchProductAttributes();
    }, 500);

    clearTimeout(timer);
  };

  const handleAddAttribute = () => {
    setSelectedAttribute(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditAttribute = (attribute: ProductAttribute) => {
    setSelectedAttribute(attribute);
    form.setFieldsValue({
      name: attribute.name,
      displayName: attribute.displayName,
      description: attribute.description,
      type: attribute.type,
      options: attribute.options,
      isFilterable: attribute.isFilterable,
      isVariant: attribute.isVariant,
      isRequired: attribute.isRequired,
    });
    setIsModalOpen(true);
  };

  const handleDeleteAttribute = (attributeId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thuộc tính này?',
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
          await axios.delete(`http://localhost:8889/api/v1/product-attributes/${attributeId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa thuộc tính thành công');
          fetchProductAttributes();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa thuộc tính');
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

      if (selectedAttribute) {
        await axios.put(`http://localhost:8889/api/v1/product-attributes/${selectedAttribute._id}`, values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật thuộc tính thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/product-attributes', values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới thuộc tính thành công');
      }

      setIsModalOpen(false);
      fetchProductAttributes();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý thuộc tính');
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
      title: 'Tên Kỹ Thuật',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ color: '#1890ff' }}>{text}</span>,
      sorter: (a: ProductAttribute, b: ProductAttribute) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'] as SortOrder[]
    },
    {
      title: 'Tên Hiển Thị',
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: (a: ProductAttribute, b: ProductAttribute) => a.displayName.localeCompare(b.displayName),
      sortDirections: ['ascend', 'descend'] as SortOrder[]
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: { color: string; label: string } } = {
          'text': { color: '#1890ff', label: 'Văn Bản' },
          'number': { color: '#2db7f5', label: 'Số' },
          'boolean': { color: '#87d068', label: 'Đúng/Sai' },
          'select': { color: '#f50', label: 'Danh Sách' }
        };
        return <Tag color={typeMap[type]?.color}>{typeMap[type]?.label}</Tag>;
      }
    },
    {
      title: 'Tùy Chọn',
      dataIndex: 'options',
      key: 'options',
      render: (options: string[]) => options?.join(', ') || '-',
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'productsCount',
      key: 'productsCount',
      render: (count: number) => <span style={{ color: '#1890ff' }}>{count}</span>,
      sorter: (a: ProductAttribute, b: ProductAttribute) => a.productsCount - b.productsCount,
      sortDirections: ['ascend', 'descend'] as SortOrder[]
    },
    {
      title: 'Lọc',
      dataIndex: 'isFilterable',
      key: 'isFilterable',
      render: (isFilterable: boolean) => (
        <Tag color={isFilterable ? 'success' : 'default'}>
          {isFilterable ? <FilterOutlined /> : '-'}
        </Tag>
      )
    },
    {
      title: 'Biến Đổi',
      dataIndex: 'isVariant',
      key: 'isVariant',
      render: (isVariant: boolean) => (
        <Tag color={isVariant ? 'success' : 'default'}>
          {isVariant ? <SwapOutlined /> : '-'}
        </Tag>
      )
    },
    {
      title: 'Bắt Buộc',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired: boolean) => (
        <Tag color={isRequired ? 'success' : 'default'}>
          {isRequired ? <CheckCircleOutlined /> : '-'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ProductAttribute) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditAttribute(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAttribute(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4}>Quản Lý Thuộc Tính Sản Phẩm</Title>
        </div>
        <div>
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              onChange={handleSearch}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAttribute}
            >
              Thêm Mới Thuộc Tính
            </Button>
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={productAttributes}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
        scroll={{ x: 1500 }}
      />

      <Modal
        title={selectedAttribute ? 'Chỉnh sửa thuộc tính' : 'Thêm mới thuộc tính'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên Kỹ Thuật"
            rules={[
              { required: true, message: 'Vui lòng nhập tên kỹ thuật' },
              { max: 50, message: 'Tên kỹ thuật không được vượt quá 50 ký tự' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Tên kỹ thuật chỉ được chứa chữ cái, số và dấu gạch dưới' }
            ]}
            tooltip="Tên kỹ thuật là tên duy nhất để tham chiếu thuộc tính trong hệ thống (ví dụ: 'screen_size', 'color', 'weight')"
          >
            <Input placeholder="Ví dụ: screen_size, color, weight" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Tên Hiển Thị"
            rules={[
              { required: true, message: 'Vui lòng nhập tên hiển thị' },
              { max: 100, message: 'Tên hiển thị không được vượt quá 100 ký tự' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả"
            rules={[{ max: 255, message: 'Mô tả không được vượt quá 255 ký tự' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select 
              options={[
                { value: 'text', label: 'Văn Bản' },
                { value: 'number', label: 'Số' },
                { value: 'boolean', label: 'Đúng/Sai' },
                { value: 'select', label: 'Danh Sách' }
              ]} 
              onChange={(value) => {
                // Reset options when type changes
                if (value !== 'select') {
                  form.setFieldsValue({ options: [] });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="options"
            label="Tùy Chọn"
            rules={[
              { required: false },
              { type: 'array', message: 'Vui lòng nhập các tùy chọn hợp lệ' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Nhập các tùy chọn, cách nhau bằng dấu phẩy (chỉ bắt buộc cho loại 'select')"
              onChange={(e) => {
                const text = e.target.value;
                if (!text) {
                  form.setFieldsValue({ options: [] });
                  return;
                }
                const options = text.split(',').map(option => option.trim());
                form.setFieldsValue({ options });
              }}
            />
          </Form.Item>

          <Form.Item
            name="isFilterable"
            label="Có Thể Lọc"
            valuePropName="checked"
          >
            <Checkbox>Có thể sử dụng để lọc sản phẩm</Checkbox>
          </Form.Item>

          <Form.Item
            name="isVariant"
            label="Là Biến Đổi"
            valuePropName="checked"
          >
            <Checkbox>Có thể tạo biến đổi sản phẩm</Checkbox>
          </Form.Item>

          <Form.Item
            name="isRequired"
            label="Bắt Buộc"
            valuePropName="checked"
          >
            <Checkbox>Có bắt buộc nhập</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductAttributesPage;
