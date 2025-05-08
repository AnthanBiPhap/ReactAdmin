import React, { useState } from 'react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  FolderOutlined,
  TagOutlined,
  EnvironmentOutlined,
  BellOutlined,
  BankOutlined,
  DollarOutlined,
  LogoutOutlined,
  SwapOutlined,
  BankOutlined as WarehouseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate } from 'react-router';
import UserInfo from '../components/UserInfo';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('DashBoard', '', <PieChartOutlined />),
  getItem('User', 'users', <FileOutlined />),
  getItem('Activity Log', 'activitylogs', <FileOutlined />),
  getItem('Address', 'addresses', <FileOutlined />),
  getItem('Brand', 'brands', <FileOutlined />),
  getItem('Cart', 'carts', <ShoppingCartOutlined />),
  getItem('Category', 'categories', <FolderOutlined />),
  getItem('Coupon', 'coupons', <TagOutlined />),
  getItem('Location', 'locations', <EnvironmentOutlined />),
  getItem('Notifications', 'notifications', <BellOutlined />),
  getItem('Orders', 'orders', <ShoppingCartOutlined />),
  getItem('Payment Methods', 'payment-methods', <BankOutlined />),
  getItem('Payments', 'payments', <DollarOutlined />),
  getItem('Product Attributes', 'product-attributes', <TagOutlined />),
  getItem('Products', 'products', <ShoppingCartOutlined />),
  // getItem('Product Variants', 'product-variants', <SwapOutlined />),
  getItem('Product Inventories', 'product-inventories', <WarehouseOutlined />),
  getItem('Review', 'reviews', <ShoppingCartOutlined />),

];

const DefaultLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate(); // Hook để điều hướng


  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: '#f0f2f5'
    }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{
          height: '100vh',
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: '#001529'
        }}
      >
        <div className="demo-logo-vertical" style={{ 
          height: 64, 
          padding: '16px 24px', 
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ 
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fff'
          }}>Admin</span>
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['1']}
          mode="inline"
          items={items}
          onClick={({ key }) => {
            navigate(`/${key}`);
          }}
          style={{
            borderRight: 'none'
          }}
        />
      </Sider>
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 200, 
        transition: 'margin-left 0.3s',
        background: '#fff'
      }}>
        <Header style={{ 
          padding: 0, 
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          zIndex: 100
        }}>
          <div style={{ 
            padding: '0 16px', 
            display: 'flex', 
            alignItems: 'center',
            gap: 16
          }}>
            <span style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1890ff'
            }}>Admin Dashboard</span>
          </div>
          <div style={{ 
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <UserInfo />
          </div>
        </Header>
        <Content style={{ 
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          minHeight: 'calc(100vh - 128px)',
          overflow: 'auto',
          borderRadius: '8px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            height: '100%'
          }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ 
          textAlign: 'center',
          padding: '16px',
          background: '#fff',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            <span style={{ color: '#666' }}>Ant Design ©{new Date().getFullYear()}</span>
            <span style={{ color: '#666' }}>Created by Ant UED</span>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;