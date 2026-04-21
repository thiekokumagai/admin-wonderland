import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Package2, Save, Shapes } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useProducts } from "@/hooks/useProducts";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  deleteProductImage,
  getProductById,
  getProductItems,
  linkProductVariations,
  removeProductVariation,
  removeProductVariationOption,
  replaceProductImage,
  updateProduct,
  updateProductItemsBatch,
  uploadProductImages,
} from "@/services/product.service";
import { ProductDetailsForm, type ProductDetailsFormValues } from "@/components/products/ProductDetailsForm";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import type { ProductImage, ProductItem, ProductResponse } from "@/types/product";
import type { Variation } from "@/types/variation";
import type { QuickEditMode } from "@/components/products/ProductStockEditor";

// Code Splitting: Carregamento tardio de componentes pesados das abas
const ProductVariationSelector = lazy(() => import("@/components/products/ProductVariationSelector").then(m => ({ default: m.ProductVariationSelector })));
const ProductImageManager = lazy(() => import("@/components/products/ProductImageManager").then(m => ({ default: m.ProductImageManager })));
const ProductStockEditor = lazy(() => import("@/components/products/ProductStockEditor").then(m => ({ default: m.ProductStockEditor })));

const productSchema = z.object({
  title: z.string().min(1, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  price: z.number().min(0, "O preço deve ser maior ou igual a zero.").optional(),
  promotionalPrice: z.number().min(0, "O preço promocional deve ser maior ou igual a zero.").optional(),
  costPrice: z.number().min(0, "O preço de custo deve ser maior ou igual a zero.").optional(),
});

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
};

function buildOptionHash(optionIds: string[]) {
  return [...optionIds].sort().join("|");
}

function getOrderedOptionIds(optionIds: string[], selectedVariationIds: string[], variations: Variation[]) {
  return selectedVariationIds
    .map((variationId) => {
      const variation = variations.find((item) => item.id === variationId);
      const option = variation?.options.find((item) => optionIds.includes(item.id));
      return option?.id ?? null;
    })
    .filter((value): value is string => !!value);
}

function getOptionCombinations(variationsWithSelections: Array<{ variation: Variation; optionIds: string[] }>) {
  return variationsWithSelections.reduce<Array<{ optionIds: string[]; labels: string[] }>>(
    (accumulator, entry) => {
      const options = entry.variation.options.filter((option) => entry.optionIds.includes(option.id));

      if (accumulator.length === 0) {
        return options.map((option) => ({
          optionIds: [option.id],
          labels: [option.value],
        }));
      }

      return accumulator.flatMap((combination) =>
        options.map((option) => ({
          optionIds: [...combination.optionIds, option.id],
          labels: [...combination.labels, option.value],
        })),
      );
    },
    [],
  );
}

function hasItemWithVariation(item: ProductItem, variationId: string) {
  return item.options.some((option) => option.variationId === variationId);
}

function hasItemWithOption(item: ProductItem, optionId: string) {
  return item.options.some((option) => option.optionId === optionId);
}

function getSelectedOptionsMap(product: ProductResponse) {
  return product.variations.reduce<Record<string, string[]>>((acc, variation) => {
    acc[variation.variationId] = variation.options.map((option) => option.id);
    return acc;
  }, {});
}

function sortProductItemsByVariationOrder(items: ProductItem[], selectedVariationIds: string[]) {
  return [...items].sort((a, b) => {
    const labelA = selectedVariationIds
      .map((variationId) => a.options.find((option) => option.variationId === variationId)?.optionValue ?? "")
      .join(" / ");
    const labelB = selectedVariationIds
      .map((variationId) => b.options.find((option) => option.variationId === variationId)?.optionValue ?? "")
      .join(" / ");

    return labelA.localeCompare(labelB, "pt-BR", { numeric: true, sensitivity: "base" });
  });
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
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariationIds, setSelectedVariationIds] = useState<string[]>([]);
  const [selectedOptionsByVariation, setSelectedOptionsByVariation] = useState<Record<string, string[]>>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [bulkMode, setBulkMode] = useState<QuickEditMode>("add");
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});

  const productForm = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      price: undefined,
      promotionalPrice: undefined,
      costPrice: undefined,
    },
  });

  const { data: savedItems = [], isLoading: loadingSavedItems, refetch: refetchItems } = useProductItems(productId ?? "");

  useEffect(() => {
    if (!savedItems?.length) return;

    setBulkValues(
      savedItems.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = "";
        return acc;
      }, {}),
    );
  }, [savedItems]);

  const selectedVariations = useMemo(
    () =>
      selectedVariationIds
        .map((variationId) => variations.find((variation) => variation.id === variationId))
        .filter((variation): variation is Variation => !!variation),
    [selectedVariationIds, variations],
  );

  const orderedSavedItems = useMemo(
    () => sortProductItemsByVariationOrder(savedItems, selectedVariationIds),
    [savedItems, selectedVariationIds],
  );

  const currentProduct = (productsQuery.data ?? []).find((product) => product.id === productId);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));
      navigate(`/produtos/${product.id}`, { replace: true });
      toast({ title: "Produto criado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível criar o produto" });
    },
  });

  // Data Layer: Uso de Query com pattern Stale-While-Revalidate e cache de 5 minutos
  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !isNewProduct && !!id,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (productQuery.data) {
      const product = productQuery.data;
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));
      productForm.reset({
        title: product.title,
        categoryId: product.categoryId,
        price: product.price,
        promotionalPrice: product.promotionalPrice,
        costPrice: product.costPrice,
      });
    }
  }, [productQuery.data, productForm]);

  const isInitialPageLoading =
    !isNewProduct && (productQuery.isLoading || categoriesQuery.loading || variationsQuery.isLoading);

  const linkVariationsMutation = useMutation({
    mutationFn: async ({ currentProductId, variationIds }: { currentProductId: string; variationIds: string[] }) => {
      const currentProductData = await getProductById(currentProductId);
      const alreadyLinkedVariationIds = currentProductData.variationIds ?? [];
      const variationIdsToLink = variationIds.filter((variationId) => !alreadyLinkedVariationIds.includes(variationId));

      let product = currentProductData;

      if (variationIdsToLink.length > 0) {
        product = await linkProductVariations(currentProductId, variationIdsToLink);
      }

      const variationsWithSelections = variationIds
        .map((variationId) => {
          const variation = variations.find((item) => item.id === variationId);
          const optionIds = selectedOptionsByVariation[variationId] ?? [];
          return variation && optionIds.length > 0 ? { variation, optionIds } : null;
        })
        .filter((entry): entry is { variation: Variation; optionIds: string[] } => !!entry);

      if (variationsWithSelections.length === 0) {
        return await getProductById(currentProductId);
      }

      const combinations = getOptionCombinations(variationsWithSelections).map((combination) => ({
        optionIds: getOrderedOptionIds(combination.optionIds, variationIds, variations),
      }));

      const existingItems = await getProductItems(currentProductId);
      const existingHashes = new Set(
        existingItems.map((item) => buildOptionHash(item.options.map((option) => option.optionId))),
      );

      const uniqueItemsToCreate = combinations.filter(
        (combination, index, array) =>
          array.findIndex((entry) => buildOptionHash(entry.optionIds) === buildOptionHash(combination.optionIds)) === index,
      );

      const itemsToCreate = uniqueItemsToCreate
        .filter((combination) => !existingHashes.has(buildOptionHash(combination.optionIds)))
        .map((combination) => ({
          options: combination.optionIds,
          stock: 0,
        }));

      if (itemsToCreate.length > 0) {
        await createProductItems(currentProductId, itemsToCreate);
      }

      return await getProductById(currentProductId);
    },
    onSuccess: async (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));
      await refetchItems();
      toast({ title: "Combinações salvas" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message || "Não foi possível vincular as variações" });
    },
  });

  // Mutation para atualizar dados básicos do produto
  const updateProductMutation = useMutation({
    mutationFn: (values: ProductDetailsFormValues) => updateProduct(productId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto atualizado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar o produto" });
    },
  });

  const removeVariationMutation = useMutation({
    mutationFn: ({ currentProductId, variationId }: { currentProductId: string; variationId: string }) =>
      removeProductVariation(currentProductId, { variationId }),
    onSuccess: async (product, variables) => {
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));

      setBulkValues((prev) => {
        const next = { ...prev };
        savedItems.forEach((item) => {
          if (hasItemWithVariation(item, variables.variationId)) {
            delete next[item.id];
          }
        });
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchItems();
      toast({ title: "Variação e estoques relacionados removidos" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a variação" });
    },
  });

  const removeVariationOptionMutation = useMutation({
    mutationFn: ({ currentProductId, variationId, optionId }: { currentProductId: string; variationId: string; optionId: string }) =>
      removeProductVariationOption(currentProductId, { variationId, optionId }),
    onSuccess: async (product, variables) => {
      setSelectedVariationIds(product.variationIds ?? []);
      setSelectedOptionsByVariation(getSelectedOptionsMap(product));

      setBulkValues((prev) => {
        const next = { ...prev };
        savedItems.forEach((item) => {
          if (hasItemWithOption(item, variables.optionId)) {
            delete next[item.id];
          }
        });
        return next;
      });

      await refetchItems();
      toast({ title: "Opção e estoques relacionados removidos" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a opção" });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: ({ currentProductId, files }: { currentProductId: string; files: File[] }) =>
      uploadProductImages(currentProductId, files),
    onSuccess: (product) => {
      setImages(product.images);
      setPendingImages([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagens enviadas com sucesso" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível enviar as imagens" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ currentProductId, imageId }: { currentProductId: string; imageId: string }) =>
      deleteProductImage(currentProductId, imageId),
    onSuccess: (_, variables) => {
      setImages((prev) => prev.filter((image) => image.id !== variables.imageId));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagem removida" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível remover a imagem" });
    },
  });

  const replaceImageMutation = useMutation({
    mutationFn: ({ currentProductId, imageId, file }: { currentProductId: string; imageId: string; file: File }) =>
      replaceProductImage(currentProductId, imageId, file),
    onSuccess: (product) => {
      setImages(product.images);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagem atualizada" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar a imagem" });
    },
  });

  const updateStockBatchMutation = useMutation({
    mutationFn: (items: { itemId: string; stock: number }[]) => updateProductItemsBatch(items),
    onSuccess: async () => {
      await refetchItems();
      setBulkValues(
        savedItems.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = "";
          return acc;
        }, {}),
      );
      toast({ title: "Estoque salvo" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível salvar o estoque" });
    },
  });

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [pendingImages]);

  // Removido useEffect de upload automático para evitar requisições duplicadas/redundantes

  const handlePendingImagesChange = (files: File[]) => {
    setPendingImages((previous) => {
      previous.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
      }));
    });
  };

  const handleRemovePendingImage = (pendingId: string) => {
    setPendingImages((prev) => {
      const target = prev.find((image) => image.id === pendingId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((image) => image.id !== pendingId);
    });
  };

  const handleSaveProductSection = async () => {
    const isValid = await productForm.trigger();
    if (!isValid) {
      return;
    }

    const formValues = productForm.getValues();

    if (!productId) {
      // Fluxo de Cadastro: Unificado (Produto -> Imagens)
      createProductMutation.mutate(formValues, {
        onSuccess: (product) => {
          if (pendingImages.length > 0) {
            uploadImagesMutation.mutate({
              currentProductId: product.id,
              files: pendingImages.map((image) => image.file),
            });
          }
        },
      });
      return;
    }

    // Fluxo de Edição: Salva os detalhes do formulário
    await updateProductMutation.mutateAsync(formValues);

    // Se houver novas fotos selecionadas no editar, envia-as agora
    // (Fotos já existentes são gerenciadas separadamente via replace/delete)
    if (pendingImages.length > 0 && !uploadImagesMutation.isPending) {
      uploadImagesMutation.mutate({
        currentProductId: productId,
        files: pendingImages.map((image) => image.file),
      });
    }
  };

  const handleChangeVariation = (slot: number, variationId: string) => {
    const nextVariationIds = [...selectedVariationIds];
    const previousVariationId = nextVariationIds[slot];
    nextVariationIds[slot] = variationId;

    const cleanedVariationIds = nextVariationIds.filter(Boolean);
    setSelectedVariationIds(cleanedVariationIds);

    setSelectedOptionsByVariation((prev) => {
      const next = { ...prev };

      if (previousVariationId && previousVariationId !== variationId) {
        delete next[previousVariationId];
      }

      if (variationId && !next[variationId]) {
        next[variationId] = [];
      }

      Object.keys(next).forEach((key) => {
        if (!cleanedVariationIds.includes(key)) {
          delete next[key];
        }
      });

      return next;
    });
  };

  const handleAddVariationSlot = () => {
    if (selectedVariationIds.length >= variations.length) {
      return;
    }

    setSelectedVariationIds((prev) => [...prev, ""]);
  };

  const handleRemoveVariationSlot = (slot: number) => {
    const variationIdToRemove = selectedVariationIds[slot];
    const nextVariationIds = selectedVariationIds.filter((_, index) => index !== slot);

    setSelectedVariationIds(nextVariationIds);

    if (variationIdToRemove) {
      setSelectedOptionsByVariation((prev) => {
        const next = { ...prev };
        delete next[variationIdToRemove];
        return next;
      });
    }
  };

  const handleToggleVariationOption = (variationId: string, optionId: string, checked: boolean) => {
    setSelectedOptionsByVariation((prev) => {
      const current = prev[variationId] ?? [];
      const nextValues = checked ? [...new Set([...current, optionId])] : current.filter((itemId) => itemId !== optionId);
      return {
        ...prev,
        [variationId]: nextValues,
      };
    });
  };

  const handleToggleAllVariationOptions = (variationId: string, checked: boolean) => {
    const variation = variations.find((item) => item.id === variationId);
    if (!variation) {
      return;
    }

    setSelectedOptionsByVariation((prev) => ({
      ...prev,
      [variationId]: checked ? variation.options.map((option) => option.id) : [],
    }));
  };

  const handleSaveVariationLinks = () => {
    if (!productId) {
      toast({ variant: "destructive", title: "Crie o produto antes de salvar as variações" });
      return;
    }

    const validVariationIds = selectedVariationIds.filter(Boolean);

    if (validVariationIds.length === 0) {
      toast({ variant: "destructive", title: "Selecione pelo menos uma variação" });
      return;
    }

    linkVariationsMutation.mutate({
      currentProductId: productId,
      variationIds: validVariationIds,
    });
  };

  const handleSaveAllStocks = () => {
    const payload = orderedSavedItems
      .filter((item) => (bulkValues[item.id] ?? "") !== "")
      .map((item) => {
        const value = Number(bulkValues[item.id]);
        const nextStock =
          bulkMode === "add"
            ? item.stock + value
            : bulkMode === "subtract"
              ? Math.max(0, item.stock - value)
              : value;

        return {
          itemId: item.id,
          stock: nextStock,
        };
      });

    const hasInvalidValue = payload.some((item) => Number.isNaN(item.stock) || item.stock < 0);

    if (hasInvalidValue) {
      toast({ variant: "destructive", title: "Informe quantidades válidas" });
      return;
    }

    if (payload.length === 0) {
      toast({ title: "Nenhuma alteração para salvar" });
      return;
    }

    updateStockBatchMutation.mutate(payload);
  };

  if (isInitialPageLoading) {
    return <PageLoader message="Carregando produto..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" className="-ml-3 w-fit">
            <Link to="/produtos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para produtos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{isNewProduct ? "Novo produto" : currentProduct?.title ?? "Editar produto"}</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro do produto com imagens, variações e controle de quantidade em estoque.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            {images.length} foto(s)
          </div>
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            {savedItems.length} SKU(s)
          </div>
        </div>
      </div>

      <Tabs defaultValue="produto" className="space-y-6">
        <TabsList className="h-auto rounded-2xl bg-muted/40 p-1">
          <TabsTrigger value="produto" className="rounded-xl px-5 py-2 data-[state=active]:bg-background">
            <Package2 className="mr-2 h-4 w-4" />
            Produto
          </TabsTrigger>
          <TabsTrigger value="variacoes" className="rounded-xl px-5 py-2 data-[state=active]:bg-background">
            <Shapes className="mr-2 h-4 w-4" />
            Variações
          </TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-xl px-5 py-2 data-[state=active]:bg-background">
            <Save className="mr-2 h-4 w-4" />
            Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produto" className="space-y-6">
          <ProductDetailsForm
            form={productForm}
            categories={categories}
            onSubmit={() => void handleSaveProductSection()}
            isSaving={
              createProductMutation.isPending ||
              updateProductMutation.isPending ||
              productQuery.isFetching ||
              uploadImagesMutation.isPending
            }
            productId={productId}
          />

          <Suspense fallback={<PageLoader message="Carregando gestor de imagens..." />}>
            <ProductImageManager
              images={images}
              pendingImages={pendingImages}
              isUploading={uploadImagesMutation.isPending}
              isDeletingImage={deleteImageMutation.isPending}
              isUpdatingImage={replaceImageMutation.isPending}
              onPendingImagesChange={handlePendingImagesChange}
              onRemovePendingImage={handleRemovePendingImage}
              onDeleteImage={(imageId) => {
                if (!productId) {
                  return;
                }
                deleteImageMutation.mutate({ currentProductId: productId, imageId });
              }}
              onReplaceImage={async (imageId, file) => {
                if (!productId) {
                  return;
                }
                await replaceImageMutation.mutateAsync({ currentProductId: productId, imageId, file });
              }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="variacoes" className="space-y-6">
          <Suspense fallback={<PageLoader message="Carregando variações..." />}>
            <ProductVariationSelector
              variations={variations}
              selectedVariationIds={selectedVariationIds}
              selectedOptionsByVariation={selectedOptionsByVariation}
              onChangeVariation={handleChangeVariation}
              onAddSlot={handleAddVariationSlot}
              onRemoveSlot={handleRemoveVariationSlot}
              onToggleOption={handleToggleVariationOption}
              onToggleAllOptions={handleToggleAllVariationOptions}
              onRemoveVariation={(variationId) => {
                if (!productId) return;
                removeVariationMutation.mutate({ currentProductId: productId, variationId });
              }}
              onRemoveVariationOption={(variationId, optionId) => {
                if (!productId) return;
                removeVariationOptionMutation.mutate({ currentProductId: productId, variationId, optionId });
              }}
              disabled={
                !productId ||
                linkVariationsMutation.isPending ||
                removeVariationMutation.isPending ||
                removeVariationOptionMutation.isPending
              }
            />
          </Suspense>

          <div>
            <Button
              type="button"
              onClick={handleSaveVariationLinks}
              disabled={!productId || linkVariationsMutation.isPending}
              className="rounded-xl"
            >
              {linkVariationsMutation.isPending ? "Salvando..." : "Salvar combinações"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <Suspense fallback={<PageLoader message="Carregando editor de estoque..." />}>
            <ProductStockEditor
              productReady={!!productId}
              hasVariations={selectedVariations.length > 0}
              loadingSavedItems={loadingSavedItems}
              savedItems={orderedSavedItems}
              bulkMode={bulkMode}
              bulkValues={bulkValues}
              isSaving={updateStockBatchMutation.isPending}
              onModeChange={setBulkMode}
              onValueChange={(itemId, value) => {
                setBulkValues((prev) => ({
                  ...prev,
                  [itemId]: value,
                }));
              }}
              onSaveAll={handleSaveAllStocks}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}