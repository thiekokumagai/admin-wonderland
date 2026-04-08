import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Package2, Plus, Save, Shapes, Trash2 } from "lucide-react";
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
  const [selectedOptionsByVariation, setSelectedOptionsByVariation] = useState<Record<string, string>>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [stockDraftByHash, setStockDraftByHash] = useState<Record<string, string>>({});
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
    () => variations.filter((variation) => selectedVariationIds.includes(variation.id)),
    [selectedVariationIds, variations],
  );

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
    mutationFn: ({ currentProductId, variationIds }: { currentProductId: string; variationIds: string[] }) =>
      linkProductVariations(currentProductId, variationIds),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedVariationIds(product.variationIds);
      setSelectedOptionsByVariation({});
      setDraftItems([]);
      setStockDraftByHash({});
      toast({ title: "Variações vinculadas" });
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

  const saveItemsMutation = useMutation({
    mutationFn: ({ currentProductId, items }: { currentProductId: string; items: CreateProductItemPayload[] }) =>
      createProductItems(currentProductId, items),
    onSuccess: async () => {
      setDraftItems([]);
      setSelectedOptionsByVariation({});
      setStockDraftByHash({});
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Itens do produto salvos" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: error.message || "Não foi possível salvar os itens" });
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
    const values = await productForm.trigger();
    if (!values) {
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
      toast({ title: "Nada novo para salvar em imagens" });
    }
  };

  const handleToggleVariation = (variationId: string, checked: boolean) => {
    setSelectedVariationIds((prev) =>
      checked ? [...prev, variationId] : prev.filter((item) => item !== variationId),
    );

    if (!checked) {
      setSelectedOptionsByVariation((prev) => {
        const next = { ...prev };
        delete next[variationId];
        return next;
      });
    }
  };

  const handleSaveVariationLinks = () => {
    if (!productId) {
      toast({ variant: "destructive", title: "Crie o produto antes de vincular variações" });
      return;
    }

    if (selectedVariationIds.length === 0) {
      toast({ variant: "destructive", title: "Selecione ao menos uma variação" });
      return;
    }

    linkVariationsMutation.mutate({
      currentProductId: productId,
      variationIds: selectedVariationIds,
    });
  };

  const handleSelectVariationOption = (variationId: string, optionId: string) => {
    setSelectedOptionsByVariation((prev) => ({
      ...prev,
      [variationId]: optionId,
    }));
  };

  const selectedOptionIds = selectedVariations
    .map((variation) => selectedOptionsByVariation[variation.id])
    .filter((value): value is string => !!value);

  const canCreateCombination =
    selectedVariations.length > 0 && selectedOptionIds.length === selectedVariations.length;

  const currentCombinationHash = canCreateCombination ? buildOptionHash(selectedOptionIds) : "";

  const handleAddDraftItem = () => {
    if (!canCreateCombination) {
      toast({ variant: "destructive", title: "Escolha uma opção para cada variação" });
      return;
    }

    const hash = buildOptionHash(selectedOptionIds);
    const stockValue = stockDraftByHash[hash] ?? "0";
    const stock = Number(stockValue);

    if (!Number.isInteger(stock) || stock < 0) {
      toast({ variant: "destructive", title: "Informe um estoque válido" });
      return;
    }

    const labels = selectedVariations.map((variation) => {
      const option = variation.options.find((item) => item.id === selectedOptionsByVariation[variation.id]);
      return option?.value ?? "";
    });

    if (draftItems.some((item) => buildOptionHash(item.optionIds) === hash)) {
      toast({ variant: "destructive", title: "Essa combinação já foi adicionada" });
      return;
    }

    setDraftItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        optionIds: selectedOptionIds,
        labels,
        stock,
      },
    ]);

    setSelectedOptionsByVariation({});
  };

  const handleSaveAllItems = () => {
    if (!productId) {
      toast({ variant: "destructive", title: "Crie o produto antes de salvar os itens" });
      return;
    }

    if (draftItems.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos uma combinação" });
      return;
    }

    const items: CreateProductItemPayload[] = draftItems.map((item) => ({
      options: item.optionIds,
      stock: item.stock,
    }));

    saveItemsMutation.mutate({ currentProductId: productId, items });
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
            Cadastro com salvamento único para dados e imagens, mais edição rápida de estoque.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            {images.length + pendingImages.length} foto(s)
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
            canUpload={false}
            onPendingImagesChange={handlePendingImagesChange}
            onRemovePendingImage={handleRemovePendingImage}
            onUpload={() => undefined}
            onDeleteImage={(imageId) => {
              if (!productId) {
                return;
              }
              deleteImageMutation.mutate({ currentProductId: productId, imageId });
            }}
          />
        </TabsContent>

        <TabsContent value="variacoes" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <ProductVariationSelector
              variations={variations}
              selectedVariationIds={selectedVariationIds}
              onToggle={handleToggleVariation}
              onSave={handleSaveVariationLinks}
              isSaving={linkVariationsMutation.isPending}
              disabled={!productId}
            />

            <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Variações escolhidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedVariations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                    Nenhuma variação selecionada.
                  </div>
                ) : (
                  selectedVariations.map((variation) => (
                    <div key={variation.id} className="rounded-2xl bg-card p-4">
                      <p className="font-medium">{variation.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {variation.options.map((option) => option.value).join(", ")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Estoque por combinação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!productId ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Crie o produto antes de configurar o estoque.
                </div>
              ) : selectedVariations.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Vincule pelo menos uma variação para começar o estoque por combinação.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {selectedVariations.map((variation) => (
                      <div key={variation.id} className="rounded-3xl bg-card p-4">
                        <p className="mb-3 font-medium">{variation.title}</p>
                        <div className="space-y-2">
                          {variation.options.map((option) => {
                            const active = selectedOptionsByVariation[variation.id] === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelectVariationOption(variation.id, option.id)}
                                className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${
                                  active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                                }`}
                              >
                                {option.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 rounded-3xl bg-card p-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="space-y-2">
                      <Label>Quantidade da combinação</Label>
                      <Input
                        type="number"
                        min="0"
                        value={currentCombinationHash ? stockDraftByHash[currentCombinationHash] ?? "" : ""}
                        onChange={(event) => {
                          if (!currentCombinationHash) {
                            return;
                          }
                          setStockDraftByHash((prev) => ({
                            ...prev,
                            [currentCombinationHash]: event.target.value,
                          }));
                        }}
                        placeholder="0"
                        disabled={!canCreateCombination}
                      />
                    </div>
                    <Button type="button" onClick={handleAddDraftItem} disabled={!canCreateCombination} className="rounded-xl">
                      Adicionar combinação
                    </Button>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Combinações prontas</h3>
                        <span className="text-sm text-muted-foreground">{draftItems.length} item(ns)</span>
                      </div>

                      {draftItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                          Nenhuma combinação adicionada ainda.
                        </div>
                      ) : (
                        draftItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-card p-4">
                            <div>
                              <p className="font-medium">{item.labels.join(" / ")}</p>
                              <p className="text-sm text-muted-foreground">Qtde: {item.stock}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDraftItems((prev) => prev.filter((draft) => draft.id !== item.id))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleSaveAllItems}
                          disabled={draftItems.length === 0 || saveItemsMutation.isPending}
                          className="rounded-xl"
                        >
                          Salvar combinações
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Estoque salvo</h3>
                        <span className="text-sm text-muted-foreground">{savedItems.length} SKU(s)</span>
                      </div>

                      {loadingSavedItems ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                          Carregando itens...
                        </div>
                      ) : savedItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                          Nenhum item salvo ainda.
                        </div>
                      ) : (
                        savedItems.map((item) => {
                          const isEditing = quickEditItemId === item.id;
                          const previewStock = quickEditValue === "" ? item.stock : getNextStock(item.stock, Number(quickEditValue || 0), quickEditMode);

                          return (
                            <div key={item.id} className="rounded-2xl bg-card p-4 space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-medium">{renderSavedItemLabel(item)}</p>
                                  <p className="text-sm text-muted-foreground">Estoque atual: {item.stock}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {!isEditing ? (
                                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => {
                                      setQuickEditItemId(item.id);
                                      setQuickEditMode("add");
                                      setQuickEditValue("");
                                    }}>
                                      <Plus className="mr-1 h-4 w-4" />
                                      Mais ou menos
                                    </Button>
                                  ) : null}
                                </div>
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
                                      <Button type="button" variant="outline" onClick={() => {
                                        setQuickEditItemId(null);
                                        setQuickEditValue("");
                                      }}>
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
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
