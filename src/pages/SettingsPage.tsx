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
  Switch,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface Setting {
  _id: string;
  key: string;
  value: string | number | boolean | object | any[];
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  group: string;
  isPublic: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SettingFormValues {
  key: string;
  value: string | number | boolean | object | any[];
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  group: string;
  isPublic: boolean;
  description?: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, [pagination.current, pagination.pageSize]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/settings', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      setSettings(response.data.data.settings || []);
      setPagination({
        ...pagination,
        total: response.data.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi lấy danh sách cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetting = () => {
    setSelectedSetting(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditSetting = (setting: Setting) => {
    setSelectedSetting(setting);
    form.setFieldsValue({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      group: setting.group,
      isPublic: setting.isPublic,
      description: setting.description,
    });
    setIsModalOpen(true);
  };

  const handleDeleteSetting = async (settingId: string) => {
    try {
      await Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa cài đặt này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
      });

      await axios.delete(`http://localhost:8889/api/v1/settings/${settingId}`);
      message.success('Xóa cài đặt thành công');
      fetchSettings();
    } catch (error) {
      message.error('Lỗi khi xóa cài đặt');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedSetting) {
        await axios.put(`http://localhost:8889/api/v1/settings/${selectedSetting._id}`, values);
        message.success('Cập nhật cài đặt thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/settings', values);
        message.success('Tạo mới cài đặt thành công');
      }

      setIsModalOpen(false);
      fetchSettings();
    } catch (error) {
      message.error('Lỗi khi xử lý cài đặt');
    }
  };

  const renderValue = (value: any, type: string) => {
    switch (type) {
      case 'string':
        return value;
      case 'number':
        return typeof value === 'number' ? value : Number(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value) : value;
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value;
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: any, record: Setting) => renderValue(value, record.type),
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'boolean' ? 'blue' : type === 'object' || type === 'array' ? 'purple' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
    },
    {
      title: 'Public',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic: boolean) => (
        <Tag color={isPublic ? 'green' : 'red'}>
          {isPublic ? 'Public' : 'Private'}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      render: (_: any, record: Setting) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditSetting(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteSetting(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Settings Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSetting}>
          Add Setting
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={settings}
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
        title={selectedSetting ? 'Edit Setting' : 'Add Setting'}
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
            name="key"
            label="Key"
            rules={[{ required: true, message: 'Please enter key!' }, { max: 100, message: 'Maximum 100 characters!' }]}
          >
            <Input disabled={!!selectedSetting} />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type!' }]}
          >
            <Select>
              <Select.Option value="string">String</Select.Option>
              <Select.Option value="number">Number</Select.Option>
              <Select.Option value="boolean">Boolean</Select.Option>
              <Select.Option value="object">Object</Select.Option>
              <Select.Option value="array">Array</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please enter value!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="group"
            label="Group"
            rules={[{ required: true, message: 'Please enter group!' }, { max: 50, message: 'Maximum 50 characters!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="isPublic"
            label="Is Public"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 255, message: 'Maximum 255 characters!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
