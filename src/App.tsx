import { Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminCategoryListPage from './pages/admin/AdminCategoryListPage';
import AdminProductListPage from './pages/admin/AdminProductListPage';
import AdminUserListPage from './pages/admin/AdminUserListPage';
import BillerDashboardPage from './pages/biller/BillerDashboardPage';
import BillerViewCartPage from './pages/biller/BillerViewCartPage';

// Utilities
import ProtectedRoute from './components/ProtectedRoute'; // Import the route guard

function App() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      {/* These routes typically don't use the MainLayout with Navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* --- Routes Requiring Authentication (using MainLayout) --- */}
      <Route element={<MainLayout />}>

        {/* Routes accessible by ANY authenticated role */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER', 'BILLER']} />}>
          {/* Redirect root to home, or make home the root */}
          {/* <Route path="/" element={<Navigate to="/home" replace />} /> */}
          {/* <Route path="/home" element={<HomePage />} /> */}
          <Route path="/" element={<HomePage />} /> {/* Make Home the default protected route */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/my-orders" element={<OrderHistoryPage />} />
          <Route path="/order-details/:orderId" element={<OrderDetailPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          {/* Add other general authenticated routes here */}
        </Route>

        {/* Routes accessible only by Customer or Biller */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'BILLER']} />}>
          <Route path="/cart" element={<CartPage />} />
          {/* Add other customer/biller specific routes here */}
        </Route>

        {/* Routes accessible only by Biller or Admin */}
        <Route element={<ProtectedRoute allowedRoles={['BILLER', 'ADMIN']} />}>
           <Route path="/biller/dashboard" element={<BillerDashboardPage />} />
           {/* Ensure this path is specific enough and correctly defined */}
           <Route path="/biller/view-cart/:userId" element={<BillerViewCartPage />} />
           {/* Add other biller routes here */}
        </Route>

        {/* Routes accessible only by Admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
           {/* <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> */}
           <Route path="/admin/categories" element={<AdminCategoryListPage />} />
           <Route path="/admin/products" element={<AdminProductListPage />} />
           <Route path="/admin/users" element={<AdminUserListPage />} />
           {/* Add other admin routes here */}
        </Route>

      </Route> {/* End of MainLayout routes */}

      {/* Catch-all for undefined routes - Placed outside MainLayout */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}

export default App;