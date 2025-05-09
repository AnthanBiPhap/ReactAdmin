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
  DatePicker,
  Upload,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface TechNew {
  _id: string;
  title: string;
  keyword: string;
  thumbnail?: string;
  description: string;
  content: string;
  date: Date;
  createdAt: string;
  updatedAt: string;
}

interface TechNewFormValues {
  title: string;
  keyword: string;
  thumbnail?: string;
  description: string;
  content: string;
  date: Date;
}

const TechNewPage: React.FC = () => {
  const [techNews, setTechNews] = useState<TechNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTechNew, setSelectedTechNew] = useState<TechNew | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTechNews();
  }, [pagination.current, pagination.pageSize]);

  const fetchTechNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/techNews', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      setTechNews(response.data.data.techNews || []);
      setPagination({
        ...pagination,
        total: response.data.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi lấy danh sách tin tức công nghệ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTechNew = () => {
    setSelectedTechNew(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditTechNew = (techNew: TechNew) => {
    setSelectedTechNew(techNew);
    form.setFieldsValue({
      title: techNew.title,
      keyword: techNew.keyword,
      thumbnail: techNew.thumbnail,
      description: techNew.description,
      content: techNew.content,
      date: techNew.date,
    });
    setIsModalOpen(true);
  };

  const handleDeleteTechNew = async (techNewId: string) => {
    try {
      await Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa tin tức này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
      });

      await axios.delete(`http://localhost:8889/api/v1/techNews/${techNewId}`);
      message.success('Xóa tin tức thành công');
      fetchTechNews();
    } catch (error) {
      message.error('Lỗi khi xóa tin tức');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedTechNew) {
        await axios.put(`http://localhost:8889/api/v1/techNews/${selectedTechNew._id}`, values);
        message.success('Cập nhật tin tức thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/techNews', values);
        message.success('Tạo mới tin tức thành công');
      }

      setIsModalOpen(false);
      fetchTechNews();
    } catch (error) {
      message.error('Lỗi khi xử lý tin tức');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <div style={{ fontWeight: 600 }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
    },
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      render: (thumbnail: string) => thumbnail ? (
        <img 
          src={thumbnail} 
          alt="Thumbnail" 
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJncmF5Ii8+PHRleHQgeD0iMjUiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjwvdGV4dD48L3N2Zz4=';
          }}
        />
      ) : (
        <div style={{ 
          width: 50, 
          height: 50,
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4
        }}>
          <span style={{ color: '#666' }}>No Image</span>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => new Date(date).toLocaleString(),
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
      render: (_: any, record: TechNew) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditTechNew(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteTechNew(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tech News Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTechNew}>
          Add Tech News
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={techNews}
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
        title={selectedTechNew ? 'Edit Tech News' : 'Add Tech News'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Please enter title!' },
              { min: 2, message: 'Title must be at least 2 characters!' },
              { max: 150, message: 'Title cannot exceed 150 characters!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="keyword"
            label="Keyword"
            rules={[
              { required: true, message: 'Please enter keyword!' },
              { min: 2, message: 'Keyword must be at least 2 characters!' },
              { max: 50, message: 'Keyword cannot exceed 50 characters!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="Thumbnail URL"
            rules={[{ max: 255, message: 'URL cannot exceed 255 characters!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description!' }, { max: 255, message: 'Description cannot exceed 255 characters!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please enter content!' }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item
            name="date"
            label="Date"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TechNewPage;
