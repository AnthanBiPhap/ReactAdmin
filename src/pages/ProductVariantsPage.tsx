import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Select, Checkbox, Tag, Typography, Image, InputNumber } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface ProductVariant {
  _id: string;
  sku: string;
  variantName: string;
  attributes: { [key: string]: string };
  price: number;
  salePrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    _id: string;
    product_name: string;
  };
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const ProductVariantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<{ _id: string; product_name: string }[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchVariants();
  }, [tokens?.accessToken, pagination.page, pagination.limit, searchText]);

  const fetchProducts = async () => {
    try {
      if (!tokens?.accessToken) return;

      const response = await axios.get('http://localhost:8889/api/v1/products', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { limit: 100 },
      });

      setProducts(response.data.data.products.map((p: any) => ({
        _id: p._id,
        product_name: p.product_name
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/productvariants', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchText
        },
      });

      setVariants(response.data.data.productVariants);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách biến đổi');
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
  };

  const handleAddVariant = () => {
    setSelectedVariant(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    form.setFieldsValue({
      sku: variant.sku,
      variantName: variant.variantName,
      // Chuyển attributes object thành chuỗi để hiển thị trong TextArea
      attributes: variant.attributes
        ? Object.entries(variant.attributes)
            .map(([key, value]) => `${key}:${value}`)
            .join(',')
        : '',
      price: variant.price,
      salePrice: variant.salePrice,
      stock: variant.stock,
      // Chuyển images array thành chuỗi để hiển thị trong TextArea
      images: Array.isArray(variant.images) ? variant.images.join(',') : '',
      isActive: variant.isActive,
      product: variant.product?._id,
    });
    setIsModalOpen(true);
  };

  const handleDeleteVariant = (variantId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa biến đổi này?',
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
          await axios.delete(`http://localhost:8889/api/v1/productvariants/${variantId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa biến đổi thành công');
          fetchVariants();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa biến đổi');
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
      let values = await form.validateFields();

      // Parse attributes nếu là string -> object
      if (typeof values.attributes === 'string') {
        values.attributes = values.attributes
          .split(',')
          .map((pair: string) => pair.split(':').map((s: string) => s.trim()))
          .reduce((obj: Record<string, string>, item: string[]) => {
            const [key, value] = item;
            if (key) obj[key] = value || '';
            return obj;
          }, {});
      }
      // Parse images nếu là string -> array
      if (typeof values.images === 'string') {
        values.images = values.images.split(',').map((url: string) => url.trim()).filter(Boolean);
      }

      if (selectedVariant) {
        await axios.put(`http://localhost:8889/api/v1/productvariants/${selectedVariant._id}`, values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật biến đổi thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/productvariants', values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới biến đổi thành công');
      }

      setIsModalOpen(false);
      fetchVariants();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý biến đổi');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Hình Ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images: string[]) => (
        images?.[0] ? (
          <Image src={images[0]} width={50} height={50} preview={{ mask: false }} />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0' }} />
        )
      ),
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (product: any) => product && product.product_name
        ? <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{product.product_name}</span>
        : <span style={{ color: '#aaa' }}>Chưa gán sản phẩm</span>,
      sorter: (a: ProductVariant, b: ProductVariant) => a.product.product_name.localeCompare(b.product.product_name),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text: string) => <span style={{ color: '#1890ff' }}>{text}</span>,
      sorter: (a: ProductVariant, b: ProductVariant) => a.sku.localeCompare(b.sku),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'Tên Biến Đổi',
      dataIndex: 'variantName',
      key: 'variantName',
      render: (text: string) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span>,
      sorter: (a: ProductVariant, b: ProductVariant) => a.variantName.localeCompare(b.variantName),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'Thuộc Tính',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attributes: { [key: string]: string }) => (
        <Space>
          {Object.entries(attributes).map(([key, value]) => (
            <Tag key={key} color="#1890ff">
              {key}: {value}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span>{price.toLocaleString('vi-VN')} ₫</span>,
      sorter: (a: ProductVariant, b: ProductVariant) => a.price - b.price,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'Giá Khuyến Mãi',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (salePrice: number) => salePrice > 0 ? <span>{salePrice.toLocaleString('vi-VN')} ₫</span> : '-',
      sorter: (a: ProductVariant, b: ProductVariant) => a.salePrice - b.salePrice,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'Kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => <span>{stock} sản phẩm</span>,
      sorter: (a: ProductVariant, b: ProductVariant) => a.stock - b.stock,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Đang Hoạt Động' : 'Ngừng Hoạt Động'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ProductVariant) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditVariant(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteVariant(record._id)}
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
          <Title level={4}>Quản Lý Biến Đổi Sản Phẩm</Title>
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
              onClick={handleAddVariant}
            >
              Thêm Mới Biến Đổi
            </Button>
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={variants}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page: number, pageSize: number) => {
            setPagination({ ...pagination, page, limit: pageSize });
          },
          showSizeChanger: true,
        }}
        rowKey="_id"
        scroll={{ x: 1500 }}
      />

      <Modal
        title={selectedVariant ? 'Chỉnh sửa biến đổi' : 'Thêm mới biến đổi'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product"
            label="Sản Phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              optionFilterProp="children"
            >
              {products.map((p) => (
                <Select.Option key={p._id} value={p._id}>
                  {p.product_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="variantName"
            label="Tên Biến Đổi"
            rules={[{ required: true, message: 'Vui lòng nhập tên biến đổi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="attributes"
            label="Thuộc Tính"
            rules={[{ required: true, message: 'Vui lòng nhập thuộc tính' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập các thuộc tính, cách nhau bằng dấu phẩy (vd: màu:đen,kích thước:M)" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá"
            rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
          >
            <Input type="number" prefix="₫" />
          </Form.Item>

          <Form.Item
            name="salePrice"
            label="Giá Khuyến Mãi"
          >
            <Input type="number" prefix="₫" />
          </Form.Item>

          <Form.Item
            name="stock"
            label="Kho"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="images"
            label="Hình Ảnh"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 hình ảnh' }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập URL của các hình ảnh, cách nhau bằng dấu phẩy" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng Thái"
            valuePropName="checked"
          >
            <Checkbox>Đang Hoạt Động</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductVariantsPage;
