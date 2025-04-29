import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Rate, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  product: string | { _id: string; name: string };
  user: string | { _id: string; userName: string };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchReviews = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/reviews', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });
      setReviews(response.data.data.reviews || response.data.data || []);
      setPagination(response.data.data.pagination || pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách đánh giá');
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

  const handleAddReview = () => {
    setSelectedReview(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    form.setFieldsValue({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images?.join(', '),
      isVerified: review.isVerified,
      product: typeof review.product === 'string' ? review.product : review.product._id,
      user: typeof review.user === 'string' ? review.user : review.user._id,
    });
    setIsModalOpen(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa đánh giá này?',
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
          await axios.delete(`http://localhost:8889/api/v1/reviews/${reviewId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });
          message.success('Xóa đánh giá thành công');
          fetchReviews();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa đánh giá');
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
      const imagesArr = values.images ? values.images.split(',').map((img: string) => img.trim()) : [];
      const body = { ...values, images: imagesArr };
      if (selectedReview) {
        await axios.put(`http://localhost:8889/api/v1/reviews/${selectedReview._id}`, body, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Cập nhật đánh giá thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/reviews', body, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        message.success('Tạo mới đánh giá thành công');
      }
      setIsModalOpen(false);
      fetchReviews();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý đánh giá');
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
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (value: number) => <Rate disabled value={value} /> },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Comment', dataIndex: 'comment', key: 'comment', ellipsis: true },
    { title: 'Images', dataIndex: 'images', key: 'images', render: (imgs: string[]) => imgs && imgs.length ? imgs.map((img, idx) => <img key={idx} src={img} alt="img" width={40} style={{ marginRight: 4 }} />) : '-' },
    { title: 'Verified', dataIndex: 'isVerified', key: 'isVerified', render: (v: boolean) => v ? <Tag color="green">Đã xác thực</Tag> : <Tag color="red">Chưa xác thực</Tag> },
    { title: 'Product', dataIndex: 'product', key: 'product', render: (p: any) => typeof p === 'object' ? p.name : p },
    { title: 'User', dataIndex: 'user', key: 'user', render: (u: any) => typeof u === 'object' ? u.userName : u },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Review) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditReview(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteReview(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReview}>
          Add Review
        </Button>
      </div>
      <Table
        dataSource={reviews}
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
        title={selectedReview ? 'Edit Review' : 'Add Review'}
        open={isModalOpen}
        onOk={handleModalOk}
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
          initialValues={{ rating: 5, isVerified: false }}
        >
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please chọn số sao!' }]}
          >
            <Rate count={5} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ max: 100, message: 'Tối đa 100 ký tự!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Vui lòng nhập nhận xét!' }, { max: 1000, message: 'Tối đa 1000 ký tự!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="images"
            label="Images (nhập nhiều link, ngăn cách dấu phẩy)"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="isVerified"
            label="Verified"
            valuePropName="checked"
          >
            <Select>
              <Option value={true}>Đã xác thực</Option>
              <Option value={false}>Chưa xác thực</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="product"
            label="Product ID"
            rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn sản phẩm!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="user"
            label="User ID"
            rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn người dùng!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewPage;
