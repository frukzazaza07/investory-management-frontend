import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import SuppliersPage from '@/pages/suppliers/SuppliersPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import InventoryItemDetailPage from '@/pages/inventory/InventoryItemDetailPage'
import ProductsPage from '@/pages/products/ProductsPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'
import PurchaseOrdersPage from '@/pages/purchase-orders/PurchaseOrdersPage'
import PurchaseOrderDetailPage from '@/pages/purchase-orders/PurchaseOrderDetailPage'
import WebhooksPage from '@/pages/webhooks/WebhooksPage'
import PosPage from '@/pages/pos/PosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/:id" element={<InventoryItemDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/pos" element={<PosPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
