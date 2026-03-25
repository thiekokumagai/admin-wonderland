import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/AdminLayout";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import ProductsPage from "@/pages/ProductsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CouponsPage from "@/pages/CouponsPage";
import DeliveriesPage from "@/pages/DeliveriesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import SettingsPage from "@/pages/SettingsPage";
import CashRegisterPage from "@/pages/CashRegisterPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
            <Route path="/cupons" element={<CouponsPage />} />
            <Route path="/entregas" element={<DeliveriesPage />} />
            <Route path="/pagamentos" element={<PaymentsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/caixa" element={<CashRegisterPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
