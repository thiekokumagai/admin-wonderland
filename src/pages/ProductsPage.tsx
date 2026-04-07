import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductListCard } from "@/components/products/ProductListCard";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus produtos com fotos, categorias e variações em uma visualização mais prática.
          </p>
        </div>

        <Button asChild className="rounded-xl">
          <Link to="/produtos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      <ProductListCard
        products={products}
        categories={categories}
        isLoading={productsQuery.isLoading || categoriesQuery.loading}
      />
    </div>
  );
}
