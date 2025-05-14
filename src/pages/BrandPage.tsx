"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Table, Button, Space, Modal, Form, Input, message, Typography } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons"
import axios from "axios"
import { useAuthStore } from "../stores/useAuthStore"
import { useNavigate } from "react-router-dom"
import debounce from "lodash/debounce"

const { Title } = Typography


interface Brand {
  _id: string
  brand_name: string
  description: string
  slug: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  totalRecord: number
  limit: number
  page: number
}

const BrandPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, tokens } = useAuthStore()
  const [form] = Form.useForm()

  const [brands, setBrands] = useState<Brand[]>([])
  const [pagination, setPagination] = useState<Pagination>({ totalRecord: 0, limit: 10, page: 1 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [allBrands, setAllBrands] = useState<Brand[]>([])

  const isAdmin = user?.roles === "admin"

  // Debounced search
  const debouncedSearch = React.useCallback(
    debounce((search: string) => {
      setPagination(prev => ({ ...prev, page: 1 }))
      loadBrands(search)
    }, 300),
    []
  )

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Initial load
  useEffect(() => {
    loadBrands()
  }, [tokens?.accessToken])

  // Handle search input change
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const fetchAllBrands = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error("Vui lòng đăng nhập để tiếp tục")
        navigate("/login")
        return []
      }

      const response = await axios.get("http://localhost:8889/api/v1/brands", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        params: {
          page: 1,
          limit: 1000, // Lấy tất cả bản ghi
        },
      })

      return response.data.data.brands || []
    } catch (error: any) {
      handleError(error, "Lỗi khi lấy danh sách thương hiệu")
      return []
    }
  }

  const filterBrands = (brands: Brand[], search: string) => {
    if (!search) return brands
    
    const searchLower = search.toLowerCase()
    return brands.filter(brand => 
      brand.brand_name.toLowerCase().includes(searchLower) ||
      (brand.description && brand.description.toLowerCase().includes(searchLower)) ||
      (brand.slug && brand.slug.toLowerCase().includes(searchLower))
    )
  }

  const loadBrands = async (search = "") => {
    try {
      setLoading(true)
      
      // Nếu chưa có dữ liệu hoặc đang tìm kiếm, lấy lại dữ liệu từ API
      if (allBrands.length === 0 || search) {
        const data = await fetchAllBrands()
        setAllBrands(data)
        
        const filtered = filterBrands(data, search)
        setBrands(filtered)
        setPagination(prev => ({
          ...prev,
          totalRecord: filtered.length
        }))
      } else {
        // Nếu đã có dữ liệu, chỉ lọc lại
        const filtered = filterBrands(allBrands, search)
        setBrands(filtered)
        setPagination(prev => ({
          ...prev,
          totalRecord: filtered.length
        }))
      }
    } catch (error) {
      console.error("Error loading brands:", error)
    } finally {
      setLoading(false)
    }
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

  const handleAddBrand = () => {
    setSelectedBrand(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    form.setFieldsValue({
      brand_name: brand.brand_name,
      description: brand.description,
      slug: brand.slug,
    })
    setIsModalOpen(true)
  }

  const handleDeleteBrand = async (brandId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa thương hiệu này?",
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
          await axios.delete(`http://localhost:8889/api/v1/brands/${brandId}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          })

          message.success("Xóa thương hiệu thành công")
          // Làm mới dữ liệu
          setAllBrands([])
          loadBrands(searchTerm)
        } catch (error: any) {
          handleError(error, "Lỗi khi xóa thương hiệu")
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

      let response
      if (selectedBrand) {
        response = await axios.put(`http://localhost:8889/api/v1/brands/${selectedBrand._id}`, values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })
        message.success("Cập nhật thương hiệu thành công")
      } else {
        response = await axios.post("http://localhost:8889/api/v1/brands", values, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })
        message.success("Tạo mới thương hiệu thành công")
      }

      // Làm mới dữ liệu sau khi thêm/cập nhật
      setAllBrands([])
      loadBrands(searchTerm)
      setIsModalOpen(false)
    } catch (error: any) {
      handleError(error, "Lỗi khi xử lý thương hiệu")
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



  const columns = [
    {
      title: "Tên Thương Hiệu",
      dataIndex: "brand_name",
      key: "brand_name",
      width: 200,
      sorter: (a: Brand, b: Brand) => a.brand_name.localeCompare(b.brand_name),
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
      width: 300,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      width: 200,
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_: any, record: Brand) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditBrand(record)}
            className="text-blue-500 hover:text-blue-700"
          >
            Sửa
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBrand(record._id)}
            className="text-red-500 hover:text-red-700"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <Title level={3} className="m-0">
          Brand Management
        </Title>
        <Space>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddBrand}
              className="rounded-md bg-blue-500 hover:bg-blue-600"
            >
              Thêm Thương Hiệu
            </Button>
          )}
          <span className={`font-medium ${user?.roles === "admin" ? "text-blue-500" : "text-red-500"}`}>
            Current Role: {user?.roles ? user.roles.charAt(0).toUpperCase() + user.roles.slice(1) : "Unknown"}
          </span>
        </Space>
      </div>

      <div className="mb-6">
        <Space>
          <Input
            placeholder="Tìm kiếm theo tên, mô tả hoặc slug"
            prefix={<SearchOutlined />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80 rounded-md"
          />
        </Space>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={brands}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalRecord,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => <span className="ml-0">Tổng cộng {total} thương hiệu</span>,
            className: "ant-table-pagination",
          }}
          onChange={handleTableChange}
          rowKey="_id"
          bordered
          className="bg-white rounded-md shadow-sm"
          rowClassName="hover:bg-gray-50 transition-colors"
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title={selectedBrand ? "Chỉnh sửa thương hiệu" : "Thêm mới thương hiệu"}
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
            name="brand_name"
            label="Tên Thương Hiệu"
            rules={[
              { required: true, message: "Vui lòng nhập tên thương hiệu" },
              { min: 2, message: "Tên thương hiệu phải có ít nhất 2 ký tự" },
              { max: 50, message: "Tên thương hiệu không được vượt quá 50 ký tự" },
            ]}
          >
            <Input className="rounded-md" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả"
            rules={[
              { required: true, message: "Vui lòng nhập mô tả" },
              { max: 500, message: "Mô tả không được vượt quá 500 ký tự" },
            ]}
          >
            <Input.TextArea rows={4} className="rounded-md" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: "Vui lòng nhập slug" },
              { min: 2, message: "Slug phải có ít nhất 2 ký tự" },
              { max: 50, message: "Slug không được vượt quá 50 ký tự" },
            ]}
          >
            <Input className="rounded-md" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BrandPage
