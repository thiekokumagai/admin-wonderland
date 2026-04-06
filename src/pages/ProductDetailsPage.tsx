import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  getProductById,
  linkProductVariations,
  updateProductItem,
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
  const isNewProduct = id === "novo";

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
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
      setProductId(product.id);
      toast({ title: "Produto salvo com sucesso" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar o produto",
      });
    },
  });

  const loadProductMutation = useMutation({
    mutationFn: getProductById,
    onSuccess: (product) => {
      setProductId(product.id);
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

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => updateProductItem(itemId, { stock: 0 }),
    onSuccess: async () => {
      await refetchItems();
      toast({ title: "Item atualizado" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível atualizar o item",
      });
    },
  });

  useEffect(() => {
    if (!isNewProduct && id) {
      loadProductMutation.mutate(id);
    }
  }, [id, isNewProduct]);

  const handleSaveProduct = (values: ProductDetailsFormValues) => {
    if (productId && !isNewProduct) {
      toast({ title: "Os dados principais já foram carregados para este produto." });
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

  const handleToggleOption = (optionId: string, checked: boolean) => {
    setSelectedOptionIds((prev) =>
      checked ? [...prev, optionId] : prev.filter((idValue) => idValue !== optionId),
    );
  };

  const handleAddDraftItem = () => {
    if (selectedOptionIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione pelo menos uma opção",
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

    const selectedOptions = selectedVariations.flatMap((variation) =>
      variation.options
        .filter((option) => selectedOptionIds.includes(option.id))
        .map((option) => ({
          variationId: variation.id,
          optionId: option.id,
          optionValue: option.value,
        })),
    );

    if (selectedOptions.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma opção válida foi encontrada",
      });
      return;
    }

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
    updateItemMutation.mutate({ itemId });
  };

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
          <h1 className="text-2xl font-bold">{isNewProduct ? "Novo produto" : "Produto"}</h1>
          <p className="text-sm text-muted-foreground">
            Crie, vincule variações e gerencie o estoque do produto em uma única página.
          </p>
        </div>
      </div>

      <ProductDetailsForm
        form={productForm}
        categories={categories}
        onSubmit={handleSaveProduct}
        isSaving={createProductMutation.isPending || loadProductMutation.isPending}
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