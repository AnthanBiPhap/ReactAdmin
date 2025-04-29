import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Input, Select, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

interface ActivityLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  user: {
    _id: string;
    userName: string;
    fullName: string;
  };
  createdAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const ActivityLogPage: React.FC = () => {
  const { user, tokens } = useAuthStore();

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    fetchActivityLogs();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchActivityLogs = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        return;
      }

      setLoading(true);
      const response = await axios.get(
        `http://localhost:8889/api/v1/activityLogs?limit=${pagination.limit}&page=${pagination.page}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );
      
      // Update state with correct data structure
      setActivityLogs(response.data.data.activityLogs);
      setPagination({
        ...pagination,
        totalRecord: response.data.data.pagination.totalRecord,
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      message.error('Lỗi khi lấy dữ liệu hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: ActivityLog, b: ActivityLog) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Người dùng',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.fullName || user?.userName,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      // filters: [
      //   { text: 'Tạo mới', value: 'create' },
      //   { text: 'Cập nhật', value: 'update' },
      //   { text: 'Xóa', value: 'delete' },
      // ],
      onFilter: (value: any, record: ActivityLog) => record.action === value,
    },
    {
      title: 'Loại đối tượng',
      dataIndex: 'entityType',
      key: 'entityType',
      // filters: [
      //   { text: 'Người dùng', value: 'users' },
      //   { text: 'Sản phẩm', value: 'products' },
      //   { text: 'Đơn hàng', value: 'orders' },
      // ],
      onFilter: (value: any, record: ActivityLog) => record.entityType === value,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    // {
    //   title: 'Chi tiết',
    //   key: 'action',
    //   render: (text: string, record: ActivityLog) => (
    //     <Button
    //       type="link"
    //       icon={<InfoCircleOutlined />}
    //       onClick={() => handleViewDetails(record)}
    //     >
    //       Xem chi tiết
    //     </Button>
    //   ),
    // },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Input.Search
            placeholder="Tìm kiếm theo hành động"
            onSearch={(value) => {
              setPagination({ ...pagination, page: 1 });
              fetchActivityLogs();
            }}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Lọc theo loại đối tượng"
            style={{ width: 200 }}
            onChange={(value) => {
              setPagination({ ...pagination, page: 1 });
              fetchActivityLogs();
            }}
          >
            <Select.Option value="users">Người dùng</Select.Option>
            <Select.Option value="products">Sản phẩm</Select.Option>
            <Select.Option value="orders">Đơn hàng</Select.Option>
          </Select>
        </Space>
        <span style={{ color: user?.roles === 'admin' ? '#1890ff' : '#52c41a' }}>
          Current Role: {user?.roles || 'Unknown'}
        </span>
      </div>

      <Table
        dataSource={Array.isArray(activityLogs) ? activityLogs : []}
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
        onChange={(newPagination) => {
          setPagination(prev => ({
            ...prev,
            page: newPagination.current || 1,
            limit: newPagination.pageSize || 10,
          }));
          fetchActivityLogs();
        }}
      />

      <Modal
        title="Chi tiết hoạt động"
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Thời gian</div>
              <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Người dùng</div>
              <div>{selectedLog.user.fullName || selectedLog.user.userName}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Hành động</div>
              <div style={{ color: getColorForAction(selectedLog.action) }}>
                {selectedLog.action}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Loại đối tượng</div>
              <div>{selectedLog.entityType}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Mô tả</div>
              <div>{selectedLog.description}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Địa chỉ IP</div>
              <div>{selectedLog.ipAddress}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>User Agent</div>
              <div>{selectedLog.userAgent}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Metadata</div>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const getColorForAction = (action: string) => {
  switch (action) {
    case 'create':
      return '#52c41a';
    case 'update':
      return '#1890ff';
    case 'delete':
      return '#f5222d';
    default:
      return '#000';
  }
};

export default ActivityLogPage;
