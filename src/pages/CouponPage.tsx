"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  DatePicker,
  Select,
  Typography,
  InputNumber,
  Switch,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, TagOutlined } from "@ant-design/icons"
import axios from "axios"
import { useAuthStore } from "../stores/useAuthStore"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import debounce from "lodash/debounce"

const { Title } = Typography
const { Search } = Input
const { RangePicker } = DatePicker

interface Coupon {
  _id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  minPurchase: number
  startDate: string
  endDate: string
  usageLimit: number
  usageCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Pagination {
  totalRecord: number
  limit: number
  page: number
}

const CouponPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, tokens } = useAuthStore()
  const [form] = Form.useForm()

  const [allCoupons, setAllCoupons] = useState<Coupon[]>([])
  const [displayedCoupons, setDisplayedCoupons] = useState<Coupon[]>([])
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [searchParams, setSearchParams] = useState({
    code: "",
    type: "",
    isActive: undefined as boolean | undefined,
  })

  const isAdmin = user?.roles === "admin"

  useEffect(() => {
    fetchAllCoupons()
  }, [tokens?.accessToken])

  const fetchAllCoupons = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error("Vui lòng đăng nhập để tiếp tục")
        navigate("/login")
        return
      }

      setLoading(true)
      const response = await axios.get("http://localhost:8889/api/v1/coupons", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: {
          page: 1,
          limit: 1000, // Lấy nhiều bản ghi để lọc phía client
        },
      })

      setAllCoupons(response.data.data.coupons)
      filterCoupons(response.data.data.coupons, searchParams)
    } catch (error: any) {
      handleError(error, "Lỗi khi lấy danh sách coupon")
    } finally {
      setLoading(false)
    }
  }

  const filterCoupons = (coupons: Coupon[], filterParams: any = {}) => {
    let filteredData = [...coupons]
    
    // Lọc theo mã coupon
    if (filterParams.code) {
      const searchTerm = filterParams.code.toLowerCase()
      filteredData = filteredData.filter((coupon) => 
        coupon.code.toLowerCase().includes(searchTerm)
      )
    }
    
    // Lọc theo loại coupon
    if (filterParams.type) {
      filteredData = filteredData.filter((coupon) => 
        coupon.type === filterParams.type
      )
    }
    
    // Lọc theo trạng thái
    if (filterParams.isActive !== undefined) {
      if (filterParams.isActive === true) {
        // Nếu tìm coupon đang hoạt động
        filteredData = filteredData.filter((coupon) => 
          isCouponActive(coupon)
        )
      } else {
        // Nếu tìm coupon không hoạt động
        filteredData = filteredData.filter((coupon) => 
          !isCouponActive(coupon)
        )
      }
    }
    
    // Cập nhật dữ liệu đã lọc
    setDisplayedCoupons(filteredData)
    setPagination({
      ...pagination,
      totalRecord: filteredData.length,
    })
  }

  const handleError = (error: any, defaultMessage: string) => {
    if (error.response?.status === 401) {
      message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại")
      navigate("/login")
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error(defaultMessage)
    }
  }

  const handleAddCoupon = () => {
    setSelectedCoupon(null)
    form.resetFields()
    form.setFieldsValue({
      usageCount: 0,
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    form.setFieldsValue({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      dateRange: [dayjs(coupon.startDate), dayjs(coupon.endDate)],
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      isActive: coupon.isActive,
    })
    setIsModalOpen(true)
  }

  const handleDeleteCoupon = (couponId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa coupon này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          if (!tokens?.accessToken) {
            message.error("Vui lòng đăng nhập để tiếp tục")
            navigate("/login")
            return
          }

          setLoading(true)
          await axios.delete(`http://localhost:8889/api/v1/coupons/${couponId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          })

          message.success("Xóa coupon thành công")
          fetchAllCoupons()
        } catch (error: any) {
          handleError(error, "Lỗi khi xóa coupon")
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const handleModalOk = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error("Vui lòng đăng nhập để tiếp tục")
        navigate("/login")
        return
      }

      setSaving(true)
      const values = await form.validateFields()

      const payload = {
        ...values,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
      }

      // Remove dateRange from payload as it's not needed in the API
      delete payload.dateRange

      if (selectedCoupon) {
        await axios.put(`http://localhost:8889/api/v1/coupons/${selectedCoupon._id}`, payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })

        message.success("Cập nhật coupon thành công")
      } else {
        await axios.post("http://localhost:8889/api/v1/coupons", payload, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })

        message.success("Tạo mới coupon thành công")
      }

      setIsModalOpen(false)
      fetchAllCoupons()
    } catch (error: any) {
      handleError(error, "Lỗi khi xử lý coupon")
    } finally {
      setSaving(false)
    }
  }

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      page: newPagination.current,
      limit: newPagination.pageSize,
    })
  }

  // Hàm xử lý tìm kiếm với debounce
  const debouncedSearch = React.useCallback(
    debounce((params: any) => {
      filterCoupons(allCoupons, params)
    }, 300),
    [allCoupons]
  )

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Tự động tìm kiếm khi searchParams thay đổi
  useEffect(() => {
    debouncedSearch(searchParams)
  }, [searchParams, debouncedSearch])

  const handleSearch = () => {
    filterCoupons(allCoupons, searchParams)
  }

  const handleResetSearch = () => {
    setSearchParams({
      code: "",
      type: "",
      isActive: undefined,
    })
    filterCoupons(allCoupons, {})
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const isCouponExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  const isCouponActive = (coupon: Coupon) => {
    return (
      coupon.isActive &&
      !isCouponExpired(coupon.endDate) &&
      (coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit)
    )
  }

  const columns = [
    {
      title: "Mã Coupon",
      dataIndex: "code",
      key: "code",
      width: 150,
      sorter: (a: Coupon, b: Coupon) => a.code.localeCompare(b.code),
      render: (code: string) => <span className="font-medium">{code.toUpperCase()}</span>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => (
        <span className={type === "percentage" ? "text-purple-600" : "text-blue-600"}>
          {type === "percentage" ? "Phần Trăm" : "Giá Cố Định"}
        </span>
      ),
    },
    {
      title: "Giá Trị",
      dataIndex: "value",
      key: "value",
      width: 120,
      render: (value: number, record: Coupon) => (
        <span className="font-medium">{record.type === "percentage" ? `${value}%` : formatCurrency(value)}</span>
      ),
    },
    {
      title: "Đơn Hàng Tối Thiểu",
      dataIndex: "minPurchase",
      key: "minPurchase",
      width: 150,
      render: (minPurchase: number) => <span>{formatCurrency(minPurchase)}</span>,
    },
    {
      title: "Thời Hạn",
      dataIndex: "startDate",
      key: "startDate",
      width: 200,
      render: (startDate: string, record: Coupon) => (
        <div>
          <div>{formatDate(startDate)}</div>
          <div>đến</div>
          <div className={isCouponExpired(record.endDate) ? "text-red-500" : "text-green-500"}>
            {formatDate(record.endDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Số Lượng Sử Dụng",
      dataIndex: "usageCount",
      key: "usageCount",
      width: 150,
      render: (usageCount: number, record: Coupon) => (
        <span className={record.usageLimit > 0 && usageCount >= record.usageLimit ? "text-red-500" : ""}>
          {usageCount}/{record.usageLimit || "∞"}
        </span>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      render: (isActive: boolean, record: Coupon) => {
        const active = isCouponActive(record)
        return (
          <span className={active ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {active ? "Hoạt Động" : "Không Hoạt Động"}
          </span>
        )
      },
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_: any, record: Coupon) =>
        isAdmin ? (
          <Space size="middle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditCoupon(record)}
              className="text-blue-500 hover:text-blue-700"
            >
              Sửa
            </Button>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCoupon(record._id)}
              className="text-red-500 hover:text-red-700"
            >
              Xóa
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <Title level={3} className="m-0 flex items-center">
          <TagOutlined className="mr-2" /> Quản Lý Mã Giảm Giá
        </Title>
        <Space>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCoupon}
              className="rounded-md bg-blue-500 hover:bg-blue-600"
            >
              Thêm Mới Coupon
            </Button>
          )}
          <span className={`font-medium ${user?.roles === "admin" ? "text-blue-500" : "text-red-500"}`}>
            Current Role: {user?.roles ? user.roles.charAt(0).toUpperCase() + user.roles.slice(1) : "Unknown"}
          </span>
        </Space>
      </div>

      <div className="mb-6 bg-white p-4 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Search
              placeholder="Tìm kiếm theo mã coupon"
              allowClear
              value={searchParams.code}
              onChange={(e) => setSearchParams({ ...searchParams, code: e.target.value })}
              onSearch={(value) => {
                setSearchParams({ ...searchParams, code: value })
                handleSearch()
              }}
              className="w-full rounded-md"
            />
          </div>
          <div>
            <Select
              placeholder="Lọc theo loại"
              allowClear
              value={searchParams.type || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, type: value })}
              className="w-full rounded-md"
              options={[
                { value: "percentage", label: "Phần Trăm" },
                { value: "fixed", label: "Giá Cố Định" },
              ]}
            />
          </div>
          <div>
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              value={searchParams.isActive}
              onChange={(value) => setSearchParams({ ...searchParams, isActive: value })}
              className="w-full rounded-md"
              options={[
                { value: true, label: "Hoạt Động" },
                { value: false, label: "Không Hoạt Động" },
              ]}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Space>
            <Button
              icon={<SearchOutlined />}
              onClick={handleSearch}
              type="primary"
              className="rounded-md bg-blue-500 hover:bg-blue-600"
            >
              Tìm Kiếm
            </Button>
            <Button onClick={handleResetSearch} className="rounded-md">
              Đặt Lại
            </Button>
          </Space>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={displayedCoupons}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalRecord,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => <span className="ml-0">Total {total} coupons</span>,
            className: "ant-table-pagination",
          }}
          onChange={handleTableChange}
          rowKey="_id"
          bordered
          className="bg-white rounded-md shadow-sm"
          rowClassName={(record) =>
            `hover:bg-gray-50 transition-colors ${isCouponExpired(record.endDate) ? "bg-gray-50" : ""}`
          }
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title={selectedCoupon ? "Chỉnh sửa coupon" : "Thêm mới coupon"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okButtonProps={{ loading: saving, className: "rounded-md bg-blue-500 hover:bg-blue-600" }}
        cancelButtonProps={{ disabled: saving, className: "rounded-md" }}
        width={600}
        className="p-4"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="code"
            label="Mã Coupon"
            rules={[
              { required: true, message: "Vui lòng nhập mã coupon" },
              { min: 2, message: "Mã coupon phải có ít nhất 2 ký tự" },
              { max: 50, message: "Mã coupon không được vượt quá 50 ký tự" },
            ]}
          >
            <Input className="rounded-md uppercase" placeholder="VD: SUMMER2023" />
          </Form.Item>

          <Form.Item name="type" label="Loại Coupon" rules={[{ required: true, message: "Vui lòng chọn loại coupon" }]}>
            <Select className="rounded-md">
              <Select.Option value="percentage">Phần Trăm (%)</Select.Option>
              <Select.Option value="fixed">Giá Cố Định (VND)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="value" label="Giá Trị" rules={[{ required: true, message: "Vui lòng nhập giá trị coupon" }]}>
            <InputNumber<number>
              min={0}
              className="w-full rounded-md"
              formatter={(value) =>
                form.getFieldValue("type") === "percentage"
                  ? `${value}%`
                  : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value!.replace(/\$\s?|(,*)|(%*)/g, ""))}
            />
          </Form.Item>

          <Form.Item
            name="minPurchase"
            label="Đơn Hàng Tối Thiểu"
            rules={[{ required: true, message: "Vui lòng nhập đơn hàng tối thiểu" }]}
          >
            <InputNumber<number>
              min={0}
              className="w-full rounded-md"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời Hạn Sử Dụng"
            rules={[{ required: true, message: "Vui lòng chọn thời hạn sử dụng" }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full rounded-md"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>

          <Form.Item name="usageLimit" label="Số Lượng Sử Dụng Tối Đa (0 = không giới hạn)">
            <InputNumber min={0} className="w-full rounded-md" />
          </Form.Item>

          <Form.Item
            name="usageCount"
            label="Số Lượng Đã Sử Dụng"
            rules={[{ required: true, message: "Vui lòng nhập số lượng đã sử dụng" }]}
          >
            <InputNumber min={0} className="w-full rounded-md" disabled={!!selectedCoupon} />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng Thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" className="bg-gray-300" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CouponPage
