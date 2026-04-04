import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/admin/AdminLayout";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const CouponsPage = lazy(() => import("@/pages/CouponsPage"));
const DeliveriesPage = lazy(() => import("@/pages/DeliveriesPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const CashRegisterPage = lazy(() => import("@/pages/CashRegisterPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
