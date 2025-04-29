import {
  Table,
  Space,
  Input,
  Button,
  Modal,
  Form,
  message,
  Upload,
  InputNumber,
  Select,
  Checkbox,
  Tag,
  Image,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface Product {
  _id: string;
  product_name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: {
    _id: string;
    category_name: string;
    [key: string]: any;
  };
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ProductFormValues {
  product_name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  images: string[];
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    form.setFieldsValue({
      ...product,
      category: product.category?._id,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8889/api/v1/products/${id}`);
      message.success('Sản phẩm đã được xóa thành công!');
      fetchProducts();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa sản phẩm!');
    }
  };

  const handleModalOk = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      // Xử lý images: chuyển fileList thành mảng URL string
      values.images = (values.images || []).map((file: any) => file.url || file.response?.url).filter(Boolean);
      console.log('Submit values:', values);
      if (selectedProduct) {
        await axios.put(`http://localhost:8889/api/v1/products/${selectedProduct._id}`, {
          ...values,
          category: values.category,
        });
        message.success('Sản phẩm đã được cập nhật thành công!');
      } else {
        await axios.post('http://localhost:8889/api/v1/products', {
          ...values,
          category: values.category,
        });
        message.success('Sản phẩm đã được tạo thành công!');
      }
      fetchProducts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Save product error:', error?.response?.data || error);
      message.error('Có lỗi xảy ra khi lưu sản phẩm!');
    } finally {
      setSaving(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/products', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchTerm,
        },
      });
      setProducts(response.data.data.products);
      setPagination({ ...pagination, total: response.data.data.total });
    } catch (error) {
      message.error('Có lỗi xảy ra khi lấy danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  // Sửa fetchCategories để lấy từ endpoint /categories/root
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8889/api/v1/categories/root');
      setCategories(response.data.data.categories);
    } catch (error) {
      message.error('Có lỗi xảy ra khi lấy danh mục sản phẩm!');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const columns: import('antd').TableColumnType<Product>[] = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      key: 'images',
      render: (images: string[]) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {images.slice(0, 3).map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`Product ${index + 1}`}
              width={64}
              height={64}
              preview={false}
            />
          ))}
        </div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as const,
      render: (category: any) => category?.category_name || '',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString()} VND`,
      sorter: true,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: 'Số lượng',
      dataIndex: 'stock',
      key: 'stock',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: Product['status']) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng hoạt động', value: 'inactive' },
      ],
      onFilter: (value: string | boolean | number | bigint, record: Product) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditProduct(record)}>
            <EditOutlined /> Chỉnh sửa
          </Button>
          <Button type="link" danger onClick={() => handleDeleteProduct(record._id)}>
            <DeleteOutlined /> Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
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
            onClick={handleAddProduct}
          >
            Thêm Mới Sản Phẩm
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page: number, pageSize: number) => {
            setPagination({ ...pagination, current: page, pageSize });
          },
          showSizeChanger: true,
        }}
        rowKey="_id"
        scroll={{ x: 1500 }}
      />

      <Modal
        title={selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm mới sản phẩm'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={saving}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={selectedProduct ? {
            ...selectedProduct,
            category: selectedProduct.category?._id,
          } : undefined}
        >
          <Form.Item
            name="product_name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
          >
            <Select
              placeholder="Chọn danh mục"
              options={categories.map((cat) => ({
                value: cat._id,
                label: cat.category_name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá"
            rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            name="stock"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng hoạt động' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="images"
            label="Ảnh sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ảnh!' }]}
          >
            <Upload.Dragger
              name="images"
              listType="picture-card"
              multiple
              maxCount={5}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('Chỉ được chọn file ảnh!');
                  return false;
                }
                return true;
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả ảnh vào đây hoặc nhấp để chọn
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ định dạng: JPG, PNG, GIF. Kích thước tối đa: 2MB.
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
