import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductListCard } from "@/components/products/ProductListCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductItems,
  linkProductVariations,
  uploadProductImages,
  createProductItems,
} from "@/services/product.service";
import { buildImageUrl } from "@/utils/image-url";
import type { ProductResponse } from "@/types/product";

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const isPageLoading = productsQuery.isLoading || categoriesQuery.loading;

  const duplicateMutation = useMutation({
    mutationFn: async (product: ProductResponse) => {
      const fullProduct = await getProductById(product.id);
      const newProduct = await createProduct({
        title: `${fullProduct.title} (Cópia)`,
        categoryId: fullProduct.categoryId,
      });

      if (fullProduct.variationIds.length > 0) {
        await linkProductVariations(newProduct.id, fullProduct.variationIds);
      }

      const items = await getProductItems(product.id);
      if (items.length > 0) {
        await createProductItems(
          newProduct.id,
          items.map((item) => ({
            stock: item.stock,
            options: item.options.map((option) => option.optionId),
          })),
        );
      }

      if (fullProduct.images.length > 0) {
        const files = await Promise.all(
          fullProduct.images.map(async (image, index) => {
            const response = await fetch(buildImageUrl(image.url));
            if (!response.ok) {
              throw new Error("Não foi possível copiar uma das imagens do produto.");
            }
            const blob = await response.blob();
            return new File([blob], `produto-${newProduct.id}-${index + 1}.jpg`, {
              type: blob.type || "image/jpeg",
            });
          }),
        );

        await uploadProductImages(newProduct.id, files);
      }

      return newProduct;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto duplicado com sucesso" });
      navigate(`/produtos/${product.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Não foi possível duplicar o produto",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Não foi possível excluir o produto",
      });
    },
  });

  if (isPageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando produtos...</span>
        </div>
      </div>
    );
  }

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
        isLoading={false}
        onDuplicate={(product) => duplicateMutation.mutate(product)}
        onDelete={(product) => deleteMutation.mutate(product.id)}
        isDuplicating={duplicateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}