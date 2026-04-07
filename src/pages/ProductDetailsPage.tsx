import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useProducts } from "@/hooks/useProducts";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  deleteProduct,
  deleteProductItem,
  getProductById,
  linkProductVariations,
  updateProduct,
} from "@/services/product.service";
import { ProductDetailsForm, type ProductDetailsFormValues } from "@/components/products/ProductDetailsForm";
import { ProductVariationSelector } from "@/components/products/ProductVariationSelector";
import { ProductStockManager, type DraftSku } from "@/components/products/ProductStockManager";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { CreateProductItemPayload } from "@/types/product";
import type { Variation } from "@/types/variation";

const productSchema = z.object({
  title: z.string().min(1, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

function buildOptionHash(optionIds: string[]) {
  return [...optionIds].sort().join("|");
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewProduct = id === "novo";

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  const productsQuery = useProducts();
  const variationsQuery = useVariations();
  const variations = variationsQuery.data ?? [];

  const [productId, setProductId] = useState<string | null>(isNewProduct ? null : id ?? null);
  const [selectedVariationIds, setSelectedVariationIds] = useState<string[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState("");
  const [draftItems, setDraftItems] = useState<DraftSku[]>([]);

  const productForm = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      categoryId: "",
    },
  });

  const { data: savedItems = [], isLoading: loadingSavedItems, refetch: refetchItems } = useProductItems(productId ?? "");

  const selectedVariations = useMemo<Variation[]>(
    () => variations.filter((variation) => selectedVariationIds.includes(variation.id)),
    [selectedVariationIds, variations],
  );

  const existingHashes = useMemo(() => {
    const hashes = savedItems.map((item) => buildOptionHash(item.options.map((option) => option.optionId)));
    return new Set(hashes);
  }, [savedItems]);

  const draftHashes = useMemo(() => new Set(draftItems.map((item) => item.hash)), [draftItems]);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId(product.id);
      setSelectedVariationIds(product.variationIds ?? []);
      toast({ title: "Produto salvo com sucesso" });
      navigate(`/produtos/${product.id}`, { replace: true });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar o produto",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId: currentProductId, values }: { productId: string; values: ProductDetailsFormValues }) =>
      updateProduct(currentProductId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Dados do produto atualizados" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível atualizar o produto",
      });
    },
  });

  const loadProductMutation = useMutation({
    mutationFn: getProductById,
    onSuccess: (product) => {
      setProductId(product.id);
      setSelectedVariationIds(product.variationIds ?? []);
      productForm.reset({
        title: product.title,
        categoryId: product.categoryId,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível carregar o produto",
      });
    },
  });

  const linkVariationsMutation = useMutation({
    mutationFn: ({ nextProductId, variationIds }: { nextProductId: string; variationIds: string[] }) =>
      linkProductVariations(nextProductId, variationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Variações vinculadas com sucesso" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível vincular as variações",
      });
    },
  });

  const saveItemsMutation = useMutation({
    mutationFn: ({ nextProductId, items }: { nextProductId: string; items: CreateProductItemPayload[] }) =>
      createProductItems(nextProductId, items),
    onSuccess: async () => {
      setDraftItems([]);
      setSelectedOptionIds([]);
      setStockInput("");
      await refetchItems();
      toast({ title: "Estoque salvo com sucesso" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar o estoque",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => deleteProductItem(itemId),
    onSuccess: async () => {
      await refetchItems();
      toast({ title: "Item removido" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível remover o item",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (currentProductId: string) => deleteProduct(currentProductId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto removido" });
      navigate("/produtos", { replace: true });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível remover o produto",
      });
    },
  });

  useEffect(() => {
    if (!isNewProduct && id) {
      loadProductMutation.mutate(id);
    }
  }, [id, isNewProduct]);

  useEffect(() => {
    setSelectedOptionIds((prev) => {
      const validOptionIds = new Set(selectedVariations.flatMap((variation) => variation.options.map((option) => option.id)));
      return prev.filter((optionId) => validOptionIds.has(optionId));
    });
  }, [selectedVariations]);

  const handleSaveProduct = (values: ProductDetailsFormValues) => {
    if (productId && !isNewProduct) {
      updateProductMutation.mutate({ productId, values });
      return;
    }

    createProductMutation.mutate(values);
  };

  const handleToggleVariation = (variationId: string, checked: boolean) => {
    setSelectedVariationIds((prev) =>
      checked ? [...prev, variationId] : prev.filter((variation) => variation !== variationId),
    );

    if (!checked) {
      const removedVariation = variations.find((variation) => variation.id === variationId);
      if (!removedVariation) return;

      const removedOptionIds = new Set(removedVariation.options.map((option) => option.id));
      setSelectedOptionIds((prev) => prev.filter((optionId) => !removedOptionIds.has(optionId)));
    }
  };

  const handleSaveVariationLinks = () => {
    if (!productId) {
      toast({
        variant: "destructive",
        title: "Salve o produto antes de vincular variações",
      });
      return;
    }

    linkVariationsMutation.mutate({
      nextProductId: productId,
      variationIds: selectedVariationIds,
    });
  };

  const handleToggleOption = (variationId: string, optionId: string, checked: boolean) => {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      const variation = selectedVariations.find((item) => item.id === variationId);

      if (!variation) {
        return prev;
      }

      if (checked) {
        variation.options.forEach((option) => {
          if (option.id === optionId) {
            next.add(option.id);
          }
        });
      } else {
        variation.options.forEach((option) => {
          if (option.id === optionId) {
            next.delete(option.id);
          }
        });
      }

      return Array.from(next);
    });
  };

  const handleAddDraftItem = () => {
    if (selectedVariations.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos uma variação",
      });
      return;
    }

    const stock = Number(stockInput);

    if (!Number.isInteger(stock) || stock < 0) {
      toast({
        variant: "destructive",
        title: "Informe um estoque válido",
      });
      return;
    }

    const selectedOptionsByVariation = selectedVariations.map((variation) => {
      const options = variation.options.filter((option) => selectedOptionIds.includes(option.id));
      return {
        variationId: variation.id,
        options,
      };
    });

    if (selectedOptionsByVariation.some((group) => group.options.length !== 1)) {
      toast({
        variant: "destructive",
        title: "Selecione exatamente uma opção para cada variação",
      });
      return;
    }

    const selectedOptions = selectedOptionsByVariation.map((group) => ({
      variationId: group.variationId,
      optionId: group.options[0].id,
      optionValue: group.options[0].value,
    }));

    const hash = buildOptionHash(selectedOptions.map((option) => option.optionId));

    if (existingHashes.has(hash) || draftHashes.has(hash)) {
      toast({
        variant: "destructive",
        title: "Essa combinação já foi adicionada",
      });
      return;
    }

    setDraftItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        stock,
        hash,
        optionIds: selectedOptions.map((option) => option.optionId),
        labels: selectedOptions.map((option) => option.optionValue),
      },
    ]);

    setSelectedOptionIds([]);
    setStockInput("");
  };

  const handleSaveAllItems = () => {
    if (!productId) {
      toast({
        variant: "destructive",
        title: "Crie ou carregue um produto antes de salvar o estoque",
      });
      return;
    }

    if (draftItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Adicione pelo menos uma combinação",
      });
      return;
    }

    const items: CreateProductItemPayload[] = draftItems.map((item) => ({
      stock: item.stock,
      options: item.optionIds.map((optionId) => {
        const found = selectedVariations
          .flatMap((variation) =>
            variation.options.map((option) => ({
              variationId: variation.id,
              optionId: option.id,
            })),
          )
          .find((option) => option.optionId === optionId);

        return {
          variationId: found?.variationId ?? "",
          optionId,
        };
      }),
    }));

    if (items.some((item) => item.options.some((option) => !option.variationId))) {
      toast({
        variant: "destructive",
        title: "Uma combinação possui opções inválidas",
      });
      return;
    }

    saveItemsMutation.mutate({
      nextProductId: productId,
      items,
    });
  };

  const handleRemoveSavedItem = (itemId: string) => {
    deleteItemMutation.mutate({ itemId });
  };

  const currentProduct = (productsQuery.data ?? []).find((product) => product.id === productId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3">
            <Link to="/produtos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para produtos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{isNewProduct ? "Novo produto" : currentProduct?.title ?? "Produto"}</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite, vincule variações e gerencie o estoque do produto em uma única página.
          </p>
        </div>

        {!isNewProduct && productId ? (
          <Button
            variant="destructive"
            onClick={() => deleteProductMutation.mutate(productId)}
            disabled={deleteProductMutation.isPending}
          >
            Excluir produto
          </Button>
        ) : null}
      </div>

      <ProductDetailsForm
        form={productForm}
        categories={categories}
        onSubmit={handleSaveProduct}
        isSaving={createProductMutation.isPending || updateProductMutation.isPending || loadProductMutation.isPending}
        productId={productId}
      />

      <ProductVariationSelector
        variations={variations}
        selectedVariationIds={selectedVariationIds}
        onToggle={handleToggleVariation}
        onSave={handleSaveVariationLinks}
        isSaving={linkVariationsMutation.isPending}
        disabled={!productId}
      />

      <ProductStockManager
        selectedVariations={selectedVariations}
        selectedOptionIds={selectedOptionIds}
        stockInput={stockInput}
        draftItems={draftItems}
        savedItems={savedItems}
        loadingSavedItems={loadingSavedItems}
        productReady={!!productId}
        onToggleOption={handleToggleOption}
        onStockInputChange={setStockInput}
        onAddDraftItem={handleAddDraftItem}
        onRemoveDraftItem={(draftId) => setDraftItems((prev) => prev.filter((item) => item.id !== draftId))}
        onRemoveSavedItem={handleRemoveSavedItem}
        onSaveAllItems={handleSaveAllItems}
        isSaving={saveItemsMutation.isPending}
      />
    </div>
  );
}
