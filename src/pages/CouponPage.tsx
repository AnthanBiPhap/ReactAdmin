import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, DatePicker, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  totalRecord: number;
  limit: number;
  page: number;
}

const CouponPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tokens } = useAuthStore();
  const [form] = Form.useForm();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const isAdmin = user?.roles === 'admin';

  useEffect(() => {
    fetchCoupons();
  }, [tokens?.accessToken, pagination.page, pagination.limit]);

  const fetchCoupons = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:8889/api/v1/coupons', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: { page: pagination.page, limit: pagination.limit },
      });

      setCoupons(response.data.data.coupons);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      handleError(error, 'Lỗi khi lấy danh sách coupon');
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

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    form.setFieldsValue({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      startDate: coupon.startDate ? dayjs(coupon.startDate) : null,
      endDate: coupon.endDate ? dayjs(coupon.endDate) : null,
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = (couponId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa coupon này?',
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
          await axios.delete(`http://localhost:8889/api/v1/coupons/${couponId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          message.success('Xóa coupon thành công');
          fetchCoupons();
        } catch (error: any) {
          handleError(error, 'Lỗi khi xóa coupon');
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
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
      };

      if (selectedCoupon) {
        await axios.put(`http://localhost:8889/api/v1/coupons/${selectedCoupon._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Cập nhật coupon thành công');
      } else {
        await axios.post('http://localhost:8889/api/v1/coupons', payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        message.success('Tạo mới coupon thành công');
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      handleError(error, 'Lỗi khi xử lý coupon');
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
    { title: 'Mã Coupon', dataIndex: 'code', key: 'code' },
    { 
      title: 'Loại', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => type === 'percentage' ? 'Phần Trăm' : 'Giá Cố Định'
    },
    { 
      title: 'Giá Trị', 
      dataIndex: 'value', 
      key: 'value',
      render: (value: number, record: Coupon) => 
        record.type === 'percentage' ? `${value}%` : `${value.toLocaleString()}đ`
    },
    { 
      title: 'Đơn Hàng Tối Thiểu', 
      dataIndex: 'minPurchase', 
      key: 'minPurchase',
      render: (minPurchase: number) => minPurchase.toLocaleString() + 'đ'
    },
    { 
      title: 'Hạn Sử Dụng', 
      dataIndex: 'startDate', 
      key: 'startDate',
      render: (startDate: string, record: Coupon) => 
        `${new Date(startDate).toLocaleDateString()} - ${new Date(record.endDate).toLocaleDateString()}`
    },
    { 
      title: 'Số Lượng Sử Dụng', 
      dataIndex: 'usageCount', 
      key: 'usageCount',
      render: (usageCount: number, record: Coupon) => 
        `${usageCount}/${record.usageLimit || '∞'}`
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive: boolean) => isActive ? 'Hoạt Động' : 'Không Hoạt Động'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Coupon) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditCoupon(record)}
          >
            Sửa
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCoupon(record._id)}
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
          onClick={handleAddCoupon}
        >
          Thêm Mới Coupon
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={coupons}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          showSizeChanger: true,
        }}
        rowKey="_id"
      />

      <Modal
        title={selectedCoupon ? 'Chỉnh sửa coupon' : 'Thêm mới coupon'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã Coupon"
            rules={[
              { required: true, message: 'Vui lòng nhập mã coupon' },
              { min: 2, message: 'Mã coupon phải có ít nhất 2 ký tự' },
              { max: 50, message: 'Mã coupon không được vượt quá 50 ký tự' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại Coupon"
            rules={[{ required: true, message: 'Vui lòng chọn loại coupon' }]}
          >
            <Select>
              <Select.Option value="percentage">Phần Trăm</Select.Option>
              <Select.Option value="fixed">Giá Cố Định</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="Giá Trị"
            rules={[{ required: true, message: 'Vui lòng nhập giá trị coupon' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="minPurchase"
            label="Đơn Hàng Tối Thiểu"
            rules={[{ required: true, message: 'Vui lòng nhập đơn hàng tối thiểu' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Ngày Bắt Đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Ngày Kết Thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <Form.Item
            name="usageLimit"
            label="Số Lượng Sử Dụng Tối Đa"
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="usageCount"
            label="Số Lượng Đã Sử Dụng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng đã sử dụng' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng Thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Select.Option value={true}>Hoạt Động</Select.Option>
              <Select.Option value={false}>Không Hoạt Động</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponPage;
