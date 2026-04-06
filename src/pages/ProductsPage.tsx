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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Veja os produtos cadastrados e entre em cada um para editar tudo em uma única tela.
          </p>
        </div>

        <Button asChild>
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