
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Menu, 
  Layout, 
  Breadcrumb, 
  Divider, 
  Statistic, 
  Button, 
  Space,
  Table,
  Progress,
  Badge,
  Avatar,
  List,
  Tag,
  message
} from 'antd';
import { 
  Link 
} from 'react-router-dom';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  ProductOutlined, 
  BarChartOutlined,
  SettingOutlined,
  DollarOutlined,
  TagOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  BankOutlined,
  AlipayCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

const { Title, Text } = Typography;
const { Header, Content, Footer, Sider } = Layout;

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  totalBrands: number;
  totalCategories: number;
  totalCoupons: number;
  recentOrders: any[];
  topProducts: any[];
  paymentMethods: any[];
  orderChange: number;
  productChange: number;
  userChange: number;
  revenueChange: number;
}

interface Order {
  _id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  user: {
    fullName: string;
  };
}

interface Product {
  _id: string;
  createdAt: string;
  product_name: string;
  salePrice: number;
  images: string[];
}

const statusColors: Record<string, string> = {
  pending: 'gold',
  processing: 'blue',
  shipped: 'geekblue',
  delivered: 'green',
  cancelled: 'red',
  paid: 'green',
  unpaid: 'orange'
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalCoupons: 0,
    recentOrders: [],
    topProducts: [],
    paymentMethods: [],
    orderChange: 0,
    productChange: 0,
    userChange: 0,
    revenueChange: 0
  });
  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchDashboardStats();
    }
  }, [tokens]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      if (!tokens?.accessToken) {
        message.error('Vui lòng đăng nhập để xem thống kê');
        return;
      }

      setLoading(true);
      const apiPromises = [
        axios.get('http://localhost:8889/api/v1/orders', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
          params: { limit: 1000 }
        }),
        axios.get('http://localhost:8889/api/v1/products', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
          params: { limit: 1000 }
        }),
        axios.get('http://localhost:8889/api/v1/users', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
          params: { limit: 1000 }
        }),
        axios.get('http://localhost:8889/api/v1/brands', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
        }),
        axios.get('http://localhost:8889/api/v1/categories/root', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
        }),
        axios.get('http://localhost:8889/api/v1/coupons', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
        }),
        axios.get('http://localhost:8889/api/v1/payments', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
        })
      ];

      const responses = await Promise.all(apiPromises);
      
      // Check for API errors
      const hasApiError = responses.some((res: any) => res.data?.statusCode !== 200);
      if (hasApiError) {
        message.error('Có lỗi khi lấy dữ liệu từ server');
        return;
      }

      // Process data
      const ordersData = responses[0].data.data?.orders || [];
      const productsData = responses[1].data.data?.products || [];
      const usersData = responses[2].data.data?.users || [];
      const brandsData = responses[3].data.data?.brands || [];
      const categoriesData = responses[4].data.data?.categories || [];
      const couponsData = responses[5].data.data?.coupons || [];
      const paymentsData = responses[6].data.data?.payments || [];

      // Calculate statistics
      const totalOrders = ordersData.length;
      const totalProducts = productsData.length;
      const totalUsers = usersData.length;
      const totalBrands = brandsData.length;
      const totalCategories = categoriesData.length;
      const totalCoupons = couponsData.length;

      // Calculate percentage changes compared to previous month
      const currentMonth = new Date().getMonth();
      const lastMonthOrders = ordersData.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth - 1;
      }).length;

      const lastMonthProducts = productsData.filter((product: Product) => {
        const productDate = new Date(product.createdAt);
        return productDate.getMonth() === currentMonth - 1;
      }).length;

      const lastMonthUsers = usersData.filter((user: any) => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === currentMonth - 1;
      }).length;

      // Calculate revenue for last month
      const lastMonthRevenue = ordersData
        .filter((order: Order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth - 1;
        })
        .reduce((acc: number, order: Order) => acc + (order.totalAmount || 0), 0);

      // Calculate total revenue
      const totalRevenue = ordersData.reduce(
        (acc: number, order: any) => acc + (order.totalAmount || 0),
        0
      );

      // Recent orders (last 5)
      const recentOrders = responses[0].data.data.orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          ...order,
          key: order._id,
          createdAt: new Date(order.createdAt).toLocaleString(),
          totalAmount: order.totalAmount?.toLocaleString() || '0'
        }));

      // Top products (by sales)
      const productSales: Record<string, number> = {};
      responses[0].data.data.orders.forEach((order: any) => {
        order.products?.forEach((item: any) => {
          const productId = item.product?._id;
          if (productId) {
            productSales[productId] = (productSales[productId] || 0) + (item.quantity || 0);
          }
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
        .slice(0, 5)
        .map(([productId, sales]) => {
          const product = responses[1].data.data.products.find((p: any) => p._id === productId);
          return {
            ...product,
            sales: sales || 0,
            key: productId,
            salePrice: product?.salePrice?.toLocaleString() || '0'
          };
        });

      // Payment methods
      const paymentMethods = [
        {
          method: 'credit_card',
          count: paymentsData.filter((p: any) => p.method === 'credit_card').length,
          amount: paymentsData
            .filter((p: any) => p.method === 'credit_card')
            .reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
        },
        {
          method: 'paypal',
          count: paymentsData.filter((p: any) => p.method === 'paypal').length,
          amount: paymentsData
            .filter((p: any) => p.method === 'paypal')
            .reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
        },
        {
          method: 'cod',
          count: paymentsData.filter((p: any) => p.method === 'cod').length,
          amount: paymentsData
            .filter((p: any) => p.method === 'cod')
            .reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
        }
      ];

      // Calculate percentage changes
      const orderChange = lastMonthOrders > 0 
        ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 
        : 0;
      
      const productChange = lastMonthProducts > 0 
        ? ((totalProducts - lastMonthProducts) / lastMonthProducts) * 100 
        : 0;
      
      const userChange = lastMonthUsers > 0 
        ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 
        : 0;
      
      const revenueChange = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      setStats({
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue,
        totalBrands,
        totalCategories,
        totalCoupons,
        recentOrders,
        topProducts,
        paymentMethods,
        orderChange,
        productChange,
        userChange,
        revenueChange
      });

      // Only show success message if data actually changed
      const hasDataChanged = JSON.stringify(stats) !== JSON.stringify({
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue,
        totalBrands,
        totalCategories,
        totalCoupons,
        recentOrders,
        topProducts,
        paymentMethods
      });

      if (hasDataChanged) {
        message.success('Đã cập nhật thống kê thành công');
      }

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      message.error(error.response?.data?.message || 'Có lỗi khi lấy dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <Link to={`/orders/${text}`}>{text}</Link>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user.fullName,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString()} VND`,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Badge 
          status={statusColors[status] as any} 
          text={status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {status === 'pending' && 'Chờ xử lý'}
          {status === 'processing' && 'Đang xử lý'}
          {status === 'shipped' && 'Đang giao'}
          {status === 'delivered' && 'Đã giao'}
          {status === 'cancelled' && 'Đã hủy'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="light"
      >
        <div className="p-4 flex items-center justify-center">
          <Title level={4} className="m-0 text-blue-600">
            E-Commerce Admin
          </Title>
        </div>
        <Menu
        theme="light"
        mode="inline"
        defaultSelectedKeys={['1']}
        items={[
          {
            key: '1',
            icon: <BarChartOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>
          },
          {
            key: '2',
            icon: <ShoppingCartOutlined />,
            label: <Link to="/orders">Đơn hàng</Link>
          },
          {
            key: '3',
            icon: <ProductOutlined />,
            label: <Link to="/products">Sản phẩm</Link>
          },
          {
            key: '4',
            icon: <UserOutlined />,
            label: <Link to="/users">Người dùng</Link>
          },
          {
            key: '5',
            icon: <AppstoreOutlined />,
            label: <Link to="/categories">Danh mục</Link>
          },
          {
            key: '6',
            icon: <TagOutlined />,
            label: <Link to="/brands">Thương hiệu</Link>
          },
          {
            key: '7',
            icon: <DollarOutlined />,
            label: <Link to="/coupons">Mã giảm giá</Link>
          },
          {
            key: '8',
            icon: <SettingOutlined />,
            label: <Link to="/settings">Cài đặt</Link>
          }
        ]}
      />
      </Sider>
      <Layout>
        <Header className="bg-white shadow-sm p-0">
          <div className="flex items-center justify-between h-16 px-6">
            <Breadcrumb
              items={[
                {
                  title: <Link to="/dashboard">Trang chủ</Link>
                },
                {
                  title: 'Dashboard'
                }
              ]}
            />
            <div className="flex items-center">
              <Avatar 
                size="default" 
                icon={<UserOutlined />} 
                className="bg-blue-500"
              />
              <Text className="ml-2">Admin</Text>
            </div>
          </div>
        </Header>
        <Content className="p-6 bg-gray-50">
          <Title level={3} className="mb-6">Tổng quan hệ thống</Title>
          
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng đơn hàng"
                  value={stats.totalOrders}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<ShoppingCartOutlined style={{ color: '#3f8600' }} />}
                  formatter={(value) => {
                    const change = stats.orderChange;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
                    return (
                      <>
                        {value}
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <ArrowUpOutlined style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }} /> {changeText}
                        </div>
                      </>
                    );
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng sản phẩm"
                  value={stats.totalProducts}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ProductOutlined style={{ color: '#cf1322' }} />}
                  formatter={(value) => {
                    const change = stats.productChange;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
                    return (
                      <>
                        {value}
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <ArrowUpOutlined style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }} /> {changeText}
                        </div>
                      </>
                    );
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng người dùng"
                  value={stats.totalUsers}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  formatter={(value) => {
                    const change = stats.userChange;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
                    return (
                      <>
                        {value}
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <ArrowUpOutlined style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }} /> {changeText}
                        </div>
                      </>
                    );
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Doanh thu"
                  value={stats.totalRevenue.toLocaleString()}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                  formatter={(value) => {
                    const change = stats.revenueChange;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
                    return (
                      <>
                        {value}
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          <ArrowUpOutlined style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }} /> {changeText}
                        </div>
                      </>
                    );
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider className="my-6" />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card 
                title="Phương thức thanh toán" 
                loading={loading}
                className="shadow-sm"
              >
                <List
                  itemLayout="horizontal"
                  dataSource={stats.paymentMethods}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: '#87d068' }}
                            icon={item.method === 'credit_card' ? <CreditCardOutlined /> : 
                                  item.method === 'paypal' ? <AlipayCircleOutlined /> : 
                                  <BankOutlined />}
                          />
                        }
                        title={
                          <div className="flex justify-between items-center w-full">
                            <span>{item.method === 'credit_card' ? 'Thẻ tín dụng' : 
                                  item.method === 'paypal' ? 'Chuyển khoản' : 
                                  'COD'}</span>
                            <span className="font-medium">{item.count} đơn</span>
                          </div>
                        }
                        description={`Tổng: ${item.amount.toLocaleString()} VND`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card 
                title="Thống kê hệ thống" 
                loading={loading}
                className="shadow-sm"
              >
                <Space direction="vertical" className="w-full">
                  <div>
                    <Text strong>Thương hiệu</Text>
                    <Progress 
                      percent={Math.min(100, (stats.totalBrands / 20) * 100)} 
                      status={stats.totalBrands >= 20 ? 'exception' : 'active'}
                      format={() => `${stats.totalBrands}/20`}
                    />
                  </div>
                  <div>
                    <Text strong>Danh mục</Text>
                    <Progress 
                      percent={Math.min(100, (stats.totalCategories / 15) * 100)} 
                      status={stats.totalCategories >= 15 ? 'exception' : 'active'}
                      format={() => `${stats.totalCategories}/15`}
                    />
                  </div>
                  <div>
                    <Text strong>Mã giảm giá</Text>
                    <Progress 
                      percent={Math.min(100, (stats.totalCoupons / 10) * 100)} 
                      status={stats.totalCoupons >= 10 ? 'exception' : 'active'}
                      format={() => `${stats.totalCoupons}/10`}
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>


        </Content>
        <Footer className="text-center py-4 bg-white shadow-sm">
          <Text type="secondary">
          
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;