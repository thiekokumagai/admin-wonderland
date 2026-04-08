import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Package2, Save, Shapes, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useProducts } from "@/hooks/useProducts";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  deleteProductImage,
  getProductById,
  linkProductVariations,
  replaceProductImage,
  updateProductItem,
  uploadProductImages,
} from "@/services/product.service";

import { ProductDetailsForm, type ProductDetailsFormValues } from "@/components/products/ProductDetailsForm";
import { ProductVariationSelector } from "@/components/products/ProductVariationSelector";
import { ProductImageManager } from "@/components/products/ProductImageManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import type { CreateProductItemPayload, ProductImage, ProductItem } from "@/types/product";
import type { Variation } from "@/types/variation";

const productSchema = z.object({
  title: z.string().min(1, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
};

type DraftItem = {
  id: string;
  optionIds: string[];
  labels: string[];
  stock: number;
};

type QuickEditMode = "add" | "subtract" | "replace";

function buildOptionHash(optionIds: string[]) {
  return [...optionIds].sort().join("|");
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

function getNextStock(currentStock: number, value: number, mode: QuickEditMode) {
  if (mode === "add") {
    return currentStock + value;
  }

  if (mode === "subtract") {
    return Math.max(0, currentStock - value);
  }

  return value;
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
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [quickEditItemId, setQuickEditItemId] = useState<string | null>(null);
  const [quickEditMode, setQuickEditMode] = useState<QuickEditMode>("add");
  const [quickEditValue, setQuickEditValue] = useState("");

  const productForm = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      categoryId: "",
    },
  });

  const { data: savedItems = [], isLoading: loadingSavedItems, refetch: refetchItems } = useProductItems(productId ?? "");

  const selectedVariations = useMemo<Variation[]>(
    () => selectedVariationIds.map((variationId) => variations.find((variation) => variation.id === variationId)).filter((variation): variation is Variation => !!variation),
    [selectedVariationIds, variations],
  );

  const combinationPreview = useMemo(() => {
    const variationsWithSelections = selectedVariations
      .map((variation) => ({
        variation,
        optionIds: selectedOptionsByVariation[variation.id] ?? [],
      }))
      .filter((entry) => entry.optionIds.length > 0);

    if (variationsWithSelections.length !== selectedVariations.length || variationsWithSelections.length === 0) {
      return [];
    }

    return getOptionCombinations(variationsWithSelections);
  }, [selectedOptionsByVariation, selectedVariations]);

  const currentProduct = (productsQuery.data ?? []).find((product) => product.id === productId);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds);
      navigate(`/produtos/${product.id}`, { replace: true });
      toast({ title: "Produto criado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível criar o produto" });
    },
  });

  const loadProductMutation = useMutation({
    mutationFn: getProductById,
    onSuccess: (product) => {
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds);
      productForm.reset({
        title: product.title,
        categoryId: product.categoryId,
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível carregar o produto" });
    },
  });

  const linkVariationsMutation = useMutation({
    mutationFn: async ({ currentProductId, variationIds }: { currentProductId: string; variationIds: string[] }) => {
      const product = await linkProductVariations(currentProductId, variationIds);

      const variationsWithSelections = variationIds
        .map((variationId) => {
          const variation = variations.find((item) => item.id === variationId);
          const optionIds = selectedOptionsByVariation[variationId] ?? [];
          return variation && optionIds.length > 0 ? { variation, optionIds } : null;
        })
        .filter((entry): entry is { variation: Variation; optionIds: string[] } => !!entry);

      if (variationsWithSelections.length > 0) {
        const combinations = getOptionCombinations(variationsWithSelections);
        const existingItems = await getProductItems(currentProductId);
        const existingHashes = new Set(existingItems.map((item) => buildOptionHash(item.options.map((option) => option.optionId))));

        const itemsToCreate: CreateProductItemPayload[] = combinations
          .filter((combination) => !existingHashes.has(buildOptionHash(combination.optionIds)))
          .map((combination) => ({
            options: combination.optionIds,
            stock: 0,
          }));

        if (itemsToCreate.length > 0) {
          await createProductItems(currentProductId, itemsToCreate);
        }
      }

      return product;
    },
    onSuccess: async (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedVariationIds(product.variationIds);
      await refetchItems();
      toast({ title: "Variações salvas com estoque inicial zero" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message || "Não foi possível vincular as variações" });
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

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, stock }: { itemId: string; stock: number }) => updateProductItem(itemId, { stock }),
    onSuccess: async () => {
      await refetchItems();
      setQuickEditItemId(null);
      setQuickEditValue("");
      toast({ title: "Estoque atualizado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar o estoque" });
    },
  });

  useEffect(() => {
    if (!isNewProduct && id) {
      loadProductMutation.mutate(id);
    }
  }, [id, isNewProduct]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [pendingImages]);

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

    if (pendingImages.length > 0) {
      uploadImagesMutation.mutate({
        currentProductId: productId,
        files: pendingImages.map((image) => image.file),
      });
    } else {
      toast({ title: "Produto salvo" });
    }
  };

  const handleChangeVariation = (slot: number, variationId: string) => {
    const nextVariationIds = [...selectedVariationIds];
    nextVariationIds[slot] = variationId;

    const cleanedVariationIds = nextVariationIds.filter(Boolean);
    setSelectedVariationIds(cleanedVariationIds);

    setSelectedOptionsByVariation((prev) => {
      const next = { ...prev };
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

  const handleToggleVariationOption = (variationId: string, optionId: string, checked: boolean) => {
    setSelectedOptionsByVariation((prev) => {
      const current = prev[variationId] ?? [];
      const nextValues = checked ? [...current, optionId] : current.filter((id) => id !== optionId);
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

  const handleRemoveCombinationLine = (variationId: string, optionId: string) => {
    handleToggleVariationOption(variationId, optionId, false);
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

  const handleApplyQuickEdit = (item: ProductItem) => {
    const value = Number(quickEditValue);

    if (!Number.isInteger(value) || value < 0) {
      toast({ variant: "destructive", title: "Informe uma quantidade válida" });
      return;
    }

    const nextStock = getNextStock(item.stock, value, quickEditMode);
    updateItemMutation.mutate({ itemId: item.id, stock: nextStock });
  };

  const renderSavedItemLabel = (item: ProductItem) => item.options.map((option) => option.optionValue).join(" / ");

  useEffect(() => {
    if (!productId || pendingImages.length === 0 || uploadImagesMutation.isPending || createProductMutation.isPending) {
      return;
    }

    uploadImagesMutation.mutate({
      currentProductId: productId,
      files: pendingImages.map((image) => image.file),
    });
  }, [createProductMutation.isPending, pendingImages, productId, uploadImagesMutation]);

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
            isSaving={createProductMutation.isPending || loadProductMutation.isPending || uploadImagesMutation.isPending}
            productId={productId}
          />

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
        </TabsContent>

        <TabsContent value="variacoes" className="space-y-6">
          <ProductVariationSelector
            variations={variations}
            selectedVariationIds={selectedVariationIds}
            selectedOptionsByVariation={selectedOptionsByVariation}
            onChangeVariation={handleChangeVariation}
            onAddSlot={handleAddVariationSlot}
            onToggleOption={handleToggleVariationOption}
            onToggleAllOptions={handleToggleAllVariationOptions}
            disabled={!productId || linkVariationsMutation.isPending}
          />

          {selectedVariations.length > 0 ? (
            <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Combinações selecionadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedVariations.map((variation) => {
                  const selectedOptionIds = selectedOptionsByVariation[variation.id] ?? [];
                  const selectedOptions = variation.options.filter((option) => selectedOptionIds.includes(option.id));

                  if (selectedOptions.length === 0) {
                    return (
                      <div key={variation.id} className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
                        {variation.title}: nenhuma opção marcada.
                      </div>
                    );
                  }

                  return (
                    <div key={variation.id} className="rounded-2xl bg-card p-4 space-y-3">
                      <p className="font-medium">{variation.title}</p>
                      {selectedOptions.map((option) => (
                        <div key={option.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                          <span className="text-sm">{option.value}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCombinationLine(variation.id, option.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          <div>
            <Button type="button" onClick={handleSaveVariationLinks} disabled={!productId || linkVariationsMutation.isPending} className="rounded-xl">
              {linkVariationsMutation.isPending ? "Salvando..." : "Salvar variações"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!productId ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Crie o produto antes de configurar o estoque.
                </div>
              ) : selectedVariations.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Salve as variações para gerar os itens com estoque zero.
                </div>
              ) : loadingSavedItems ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Carregando itens...
                </div>
              ) : savedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Nenhum item gerado ainda. Salve as variações para criar os itens automaticamente.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedItems.map((item) => {
                    const isEditing = quickEditItemId === item.id;
                    const previewStock = quickEditValue === "" ? item.stock : getNextStock(item.stock, Number(quickEditValue || 0), quickEditMode);

                    return (
                      <div key={item.id} className="space-y-3 rounded-2xl bg-card p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{renderSavedItemLabel(item)}</p>
                            <p className="text-sm text-muted-foreground">Quantidade atual: {item.stock}</p>
                          </div>

                          {!isEditing ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => {
                                setQuickEditItemId(item.id);
                                setQuickEditMode("add");
                                setQuickEditValue("");
                              }}
                            >
                              Editar quantidade
                            </Button>
                          ) : null}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 rounded-2xl border border-dashed p-4">
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant={quickEditMode === "add" ? "default" : "outline"} onClick={() => setQuickEditMode("add")}>
                                Somar
                              </Button>
                              <Button type="button" size="sm" variant={quickEditMode === "subtract" ? "default" : "outline"} onClick={() => setQuickEditMode("subtract")}>
                                Subtrair
                              </Button>
                              <Button type="button" size="sm" variant={quickEditMode === "replace" ? "default" : "outline"} onClick={() => setQuickEditMode("replace")}>
                                Substituir
                              </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
                              <div className="space-y-2">
                                <Label>Quantidade</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={quickEditValue}
                                  onChange={(event) => setQuickEditValue(event.target.value)}
                                  placeholder="0"
                                />
                              </div>

                              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                                Resultado previsto: <span className="font-medium text-foreground">{Number.isNaN(previewStock) ? item.stock : previewStock}</span>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setQuickEditItemId(null);
                                    setQuickEditValue("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button type="button" onClick={() => handleApplyQuickEdit(item)} disabled={updateItemMutation.isPending}>
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}