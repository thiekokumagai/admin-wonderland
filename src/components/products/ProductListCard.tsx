import { Link } from "react-router-dom";
import { ArrowRight, Images, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { buildImageUrl } from "@/utils/image-url";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProductResponse } from "@/types/product";
import type { CategoryList } from "@/types/category";

type ProductListCardProps = {
  products: ProductResponse[];
  categories: CategoryList[];
  isLoading: boolean;
};

export function ProductListCard({ products, categories, isLoading }: ProductListCardProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.title ?? "Sem categoria";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, products, search]);

  return (
    <div className="space-y-5">
      <Card className="border-0 bg-muted/30 shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Carregando produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Nenhum produto encontrado para os filtros informados.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const cover = product.images[0]?.url ? buildImageUrl(product.images[0].url) : "";

            return (
              <Card key={product.id} className="overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square bg-muted">
                  {cover ? (
                    <img src={cover} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {getCategoryName(product.categoryId)}
                    </Badge>
                    <h3 className="line-clamp-2 min-h-12 text-base font-semibold">{product.title}</h3>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Images className="h-4 w-4" />
                      {product.images.length} foto(s)
                    </span>
                    <span>{product.itemsCount} item(ns)</span>
                  </div>

                  <Button asChild className="w-full rounded-xl">
                    <Link to={`/produtos/${product.id}`}>
                      Editar produto
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
