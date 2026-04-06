import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/types/product";
import type { CategoryList } from "@/types/category";

type ProductListCardProps = {
  products: ProductResponse[];
  categories: CategoryList[];
  isLoading: boolean;
};

export function ProductListCard({ products, categories, isLoading }: ProductListCardProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.title ?? "Sem categoria";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <Package className="h-4 w-4 text-primary" />
                  <span>{product.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getCategoryName(product.categoryId)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">ID: {product.id}</p>
              </div>

              <Button asChild variant="outline">
                <Link to={`/produtos/${product.id}`}>
                  Abrir produto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}