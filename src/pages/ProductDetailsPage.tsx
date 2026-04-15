import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Package2, Plus, Save, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProductItems } from "@/hooks/useProductItems";
import { useProducts } from "@/hooks/useProducts";
import { useVariations } from "@/hooks/useVariations";
import {
  createProduct,
  createProductItems,
  deleteProduct,
  deleteProductImage,
  getProductById,
  updateProductItem,
  uploadProductImages,
} from "@/services/product.service";
import { ProductDetailsForm, type ProductDetailsFormValues } from "@/components/products/ProductDetailsForm";
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
  sku: string;
  price: string;
  promotionalPrice: string;
  costPrice: string;
};

type QuickEditMode = "add" | "subtract" | "replace";

type SimpleItemForm = {
  stock: string;
  sku: string;
  price: string;
  promotionalPrice: string;
  costPrice: string;
};

const emptySimpleItemForm: SimpleItemForm = {
  stock: "",
  sku: "",
  price: "",
  promotionalPrice: "",
  costPrice: "",
};

function buildOptionHash(optionIds: string[]) {
  return [...optionIds].sort().join("|");
}

function getNextStock(currentStock: number, value: number, mode: QuickEditMode) {
  if (mode === "add") return currentStock + value;
  if (mode === "subtract") return Math.max(0, currentStock - value);
  return value;
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? undefined : parsed;
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
  const [simpleItemForm, setSimpleItemForm] = useState<SimpleItemForm>(emptySimpleItemForm);

  const productForm = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { title: "", categoryId: "" },
  });

  const { data: savedItems = [], isLoading: loadingSavedItems, refetch: refetchItems } = useProductItems(productId ?? "");

  const selectedVariations = useMemo<Variation[]>(
    () => variations.filter((variation) => selectedVariationIds.includes(variation.id)),
    [selectedVariationIds, variations],
  );

  const currentProduct = (productsQuery.data ?? []).find((product) => product.id === productId);
  const isSimpleProduct = selectedVariationIds.length === 0;

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
  });

  const deleteProductMutation = useMutation({
    mutationFn: (currentProductId: string) => deleteProduct(currentProductId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/produtos", { replace: true });
      toast({ title: "Produto removido" });
    },
  });

  const loadProductMutation = useMutation({
    mutationFn: getProductById,
    onSuccess: (product) => {
      setProductId(product.id);
      setImages(product.images);
      setSelectedVariationIds(product.variationIds);
      productForm.reset({ title: product.title, categoryId: product.categoryId });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: ({ currentProductId, files }: { currentProductId: string; files: File[] }) => uploadProductImages(currentProductId, files),
    onSuccess: (product) => {
      setImages(product.images);
      setPendingImages([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagens enviadas com sucesso" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ currentProductId, imageId }: { currentProductId: string; imageId: string }) => deleteProductImage(currentProductId, imageId),
    onSuccess: (_, variables) => {
      setImages((prev) => prev.filter((image) => image.id !== variables.imageId));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Imagem removida" });
    },
  });

  const saveItemsMutation = useMutation({
    mutationFn: ({ currentProductId, items }: { currentProductId: string; items: CreateProductItemPayload[] }) => createProductItems(currentProductId, items),
    onSuccess: async () => {
      setDraftItems([]);
      setSelectedOptionsByVariation({});
      setStockDraftByHash({});
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Itens do produto salvos" });
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
  });

  useEffect(() => {
    if (!isNewProduct && id) {
      loadProductMutation.mutate(id);
    }
  }, [id, isNewProduct]);

  useEffect(() => {
    if (savedItems.length === 1 && savedItems[0].options.length === 0) {
      setSimpleItemForm({
        stock: String(savedItems[0].stock ?? ""),
        sku: savedItems[0].sku ?? "",
        price: savedItems[0].price?.toString() ?? "",
        promotionalPrice: savedItems[0].promotionalPrice?.toString() ?? "",
        costPrice: savedItems[0].costPrice?.toString() ?? "",
      });
    }
  }, [savedItems]);

  useEffect(() => {
    return () => pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
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
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== pendingId);
    });
  };

  const handleSaveProductSection = async () => {
    const valid = await productForm.trigger();
    if (!valid) return;

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

  const handleSelectVariationOption = (variationId: string, optionId: string) => {
    setSelectedOptionsByVariation((prev) => ({ ...prev, [variationId]: optionId }));
  };

  const selectedOptionIds = selectedVariations
    .map((variation) => selectedOptionsByVariation[variation.id])
    .filter((value): value is string => !!value);

  const canCreateCombination = selectedVariations.length > 0 && selectedOptionIds.length === selectedVariations.length;
  const currentCombinationHash = canCreateCombination ? buildOptionHash(selectedOptionIds) : "";

  const handleAddDraftItem = () => {
    if (!canCreateCombination) {
      toast({ variant: "destructive", title: "Escolha uma opção para cada variação" });
      return;
    }

    const hash = buildOptionHash(selectedOptionIds);
    const stock = Number(stockDraftByHash[hash] ?? "0");
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
        sku: "",
        price: "",
        promotionalPrice: "",
        costPrice: "",
      },
    ]);
    setSelectedOptionsByVariation({});
  };

  const handleSaveAllItems = () => {
    if (!productId) {
      toast({ variant: "destructive", title: "Crie o produto antes de salvar os itens" });
      return;
    }

    if (isSimpleProduct) {
      const stock = Number(simpleItemForm.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        toast({ variant: "destructive", title: "Informe um estoque válido para o produto simples" });
        return;
      }

      saveItemsMutation.mutate({
        currentProductId: productId,
        items: [{
          stock,
          sku: simpleItemForm.sku || undefined,
          price: toOptionalNumber(simpleItemForm.price),
          promotionalPrice: toOptionalNumber(simpleItemForm.promotionalPrice),
          costPrice: toOptionalNumber(simpleItemForm.costPrice),
        }],
      });
      return;
    }

    if (draftItems.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos uma combinação" });
      return;
    }

    saveItemsMutation.mutate({
      currentProductId: productId,
      items: draftItems.map((item) => ({
        options: item.optionIds,
        stock: item.stock,
        sku: item.sku || undefined,
        price: toOptionalNumber(item.price),
        promotionalPrice: toOptionalNumber(item.promotionalPrice),
        costPrice: toOptionalNumber(item.costPrice),
      })),
    });
  };

  const handleApplyQuickEdit = (item: ProductItem) => {
    const value = Number(quickEditValue);
    if (!Number.isInteger(value) || value < 0) {
      toast({ variant: "destructive", title: "Informe uma quantidade válida" });
      return;
    }

    updateItemMutation.mutate({ itemId: item.id, stock: getNextStock(item.stock, value, quickEditMode) });
  };

  const renderSavedItemLabel = (item: ProductItem) =>
    item.options.length > 0 ? item.options.map((option) => option.optionValue).join(" / ") : "Produto simples";

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
          <p className="text-sm text-muted-foreground">Agora com preços, SKU e suporte para produto simples ou com variações.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isNewProduct && productId ? (
            <Button variant="destructive" onClick={() => deleteProductMutation.mutate(productId)} disabled={deleteProductMutation.isPending}>
              Excluir produto
            </Button>
          ) : null}
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">{images.length + pendingImages.length} foto(s)</div>
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">{savedItems.length} SKU(s)</div>
        </div>
      </div>

      <Tabs defaultValue="produto" className="space-y-6">
        <TabsList className="h-auto rounded-2xl bg-muted/40 p-1">
          <TabsTrigger value="produto" className="rounded-xl px-5 py-2 data-[state=active]:bg-background">
            <Package2 className="mr-2 h-4 w-4" />Produto
          </TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-xl px-5 py-2 data-[state=active]:bg-background">
            <Save className="mr-2 h-4 w-4" />Estoque e valores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produto" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <ProductDetailsForm form={productForm} categories={categories} onSubmit={() => undefined} isSaving={createProductMutation.isPending || loadProductMutation.isPending} productId={productId} />

            <div className="space-y-6">
              <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
                <CardHeader><CardTitle className="text-lg">Resumo rápido</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl bg-card p-4">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="mt-1 font-medium">{categories.find((category) => category.id === productForm.watch("categoryId"))?.title ?? "Não selecionada"}</p>
                  </div>
                  <div className="rounded-2xl bg-card p-4">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="mt-1 font-medium">{isSimpleProduct ? "Produto simples" : "Com variações"}</p>
                  </div>
                  <div className="rounded-2xl bg-card p-4">
                    <p className="text-sm text-muted-foreground">Imagens</p>
                    <p className="mt-1 font-medium">{images.length + pendingImages.length} no total</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
                <CardHeader><CardTitle className="text-lg">Salvar seção</CardTitle></CardHeader>
                <CardContent>
                  <Button type="button" className="w-full rounded-xl" onClick={() => void handleSaveProductSection()}>
                    Salvar título, categoria e imagens
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <ProductImageManager
            images={images}
            pendingImages={pendingImages}
            isUploading={uploadImagesMutation.isPending}
            isDeletingImage={deleteImageMutation.isPending}
            onPendingImagesChange={handlePendingImagesChange}
            onRemovePendingImage={handleRemovePendingImage}
            onDeleteImage={(imageId) => {
              if (!productId) return;
              deleteImageMutation.mutate({ currentProductId: productId, imageId });
            }}
          />
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
            <CardHeader><CardTitle className="text-lg">Estoque, SKU e valores</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {!productId ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Crie o produto antes de cadastrar estoque e valores.</div>
              ) : isSimpleProduct ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                  <Card className="rounded-3xl bg-card shadow-none">
                    <CardHeader><CardTitle className="text-base">Produto simples</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Estoque</Label><Input type="number" min="0" value={simpleItemForm.stock} onChange={(e) => setSimpleItemForm((prev) => ({ ...prev, stock: e.target.value }))} placeholder="0" /></div>
                      <div className="space-y-2"><Label>SKU</Label><Input value={simpleItemForm.sku} onChange={(e) => setSimpleItemForm((prev) => ({ ...prev, sku: e.target.value }))} placeholder="SKU do produto" /></div>
                      <div className="space-y-2"><Label>Preço</Label><Input value={simpleItemForm.price} onChange={(e) => setSimpleItemForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="0,00" /></div>
                      <div className="space-y-2"><Label>Preço promocional</Label><Input value={simpleItemForm.promotionalPrice} onChange={(e) => setSimpleItemForm((prev) => ({ ...prev, promotionalPrice: e.target.value }))} placeholder="0,00" /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Custo</Label><Input value={simpleItemForm.costPrice} onChange={(e) => setSimpleItemForm((prev) => ({ ...prev, costPrice: e.target.value }))} placeholder="0,00" /></div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-0 bg-card shadow-none">
                    <CardHeader><CardTitle className="text-base">Salvar item</CardTitle></CardHeader>
                    <CardContent>
                      <Button type="button" onClick={handleSaveAllItems} className="w-full rounded-xl" disabled={saveItemsMutation.isPending}>
                        Salvar produto simples
                      </Button>
                    </CardContent>
                  </Card>
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
                              <button key={option.id} type="button" onClick={() => handleSelectVariationOption(variation.id, option.id)} className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                                {option.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 rounded-3xl bg-card p-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="0"
                        value={currentCombinationHash ? stockDraftByHash[currentCombinationHash] ?? "" : ""}
                        onChange={(event) => {
                          if (!currentCombinationHash) return;
                          setStockDraftByHash((prev) => ({ ...prev, [currentCombinationHash]: event.target.value }));
                        }}
                        placeholder="0"
                        disabled={!canCreateCombination}
                      />
                    </div>

                    <div className="flex items-end justify-end">
                      <Button type="button" onClick={handleAddDraftItem} disabled={!canCreateCombination} className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />Adicionar combinação
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Combinações prontas</h3>
                        <span className="text-sm text-muted-foreground">{draftItems.length} item(ns)</span>
                      </div>

                      {draftItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Nenhuma combinação adicionada ainda.</div>
                      ) : (
                        draftItems.map((item) => (
                          <div key={item.id} className="rounded-2xl bg-card p-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium">{item.labels.join(" / ")}</p>
                                <p className="text-sm text-muted-foreground">Qtde: {item.stock}</p>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => setDraftItems((prev) => prev.filter((draft) => draft.id !== item.id))}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2"><Label>SKU</Label><Input value={item.sku} onChange={(e) => setDraftItems((prev) => prev.map((draft) => draft.id === item.id ? { ...draft, sku: e.target.value } : draft))} placeholder="SKU" /></div>
                              <div className="space-y-2"><Label>Preço</Label><Input value={item.price} onChange={(e) => setDraftItems((prev) => prev.map((draft) => draft.id === item.id ? { ...draft, price: e.target.value } : draft))} placeholder="0,00" /></div>
                              <div className="space-y-2"><Label>Preço promocional</Label><Input value={item.promotionalPrice} onChange={(e) => setDraftItems((prev) => prev.map((draft) => draft.id === item.id ? { ...draft, promotionalPrice: e.target.value } : draft))} placeholder="0,00" /></div>
                              <div className="space-y-2"><Label>Custo</Label><Input value={item.costPrice} onChange={(e) => setDraftItems((prev) => prev.map((draft) => draft.id === item.id ? { ...draft, costPrice: e.target.value } : draft))} placeholder="0,00" /></div>
                            </div>
                          </div>
                        ))
                      )}

                      <div className="flex justify-end">
                        <Button type="button" onClick={handleSaveAllItems} disabled={draftItems.length === 0 || saveItemsMutation.isPending} className="rounded-xl">
                          Salvar combinações
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Itens salvos</h3>
                        <span className="text-sm text-muted-foreground">{savedItems.length} item(ns)</span>
                      </div>

                      {loadingSavedItems ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Carregando itens...</div>
                      ) : savedItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Nenhum item salvo ainda.</div>
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
                                  <p className="text-xs text-muted-foreground">SKU: {item.sku || "-"} • Preço: {item.price ?? "-"} • Promo: {item.promotionalPrice ?? "-"}</p>
                                </div>

                                {!isEditing ? (
                                  <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => {
                                    setQuickEditItemId(item.id);
                                    setQuickEditMode("add");
                                    setQuickEditValue("");
                                  }}>
                                    <Plus className="mr-1 h-4 w-4" />Mais ou menos
                                  </Button>
                                ) : null}
                              </div>

                              {isEditing ? (
                                <div className="space-y-3 rounded-2xl border border-dashed p-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Button type="button" size="sm" variant={quickEditMode === "add" ? "default" : "outline"} onClick={() => setQuickEditMode("add")}>Somar</Button>
                                    <Button type="button" size="sm" variant={quickEditMode === "subtract" ? "default" : "outline"} onClick={() => setQuickEditMode("subtract")}>Subtrair</Button>
                                    <Button type="button" size="sm" variant={quickEditMode === "replace" ? "default" : "outline"} onClick={() => setQuickEditMode("replace")}>Substituir</Button>
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
                                    <div className="space-y-2"><Label>Quantidade</Label><Input type="number" min="0" value={quickEditValue} onChange={(e) => setQuickEditValue(e.target.value)} placeholder="0" /></div>
                                    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">Resultado previsto: <span className="font-medium text-foreground">{Number.isNaN(previewStock) ? item.stock : previewStock}</span></div>
                                    <div className="flex gap-2">
                                      <Button type="button" variant="outline" onClick={() => { setQuickEditItemId(null); setQuickEditValue(""); }}>Cancelar</Button>
                                      <Button type="button" onClick={() => handleApplyQuickEdit(item)} disabled={updateItemMutation.isPending}>Salvar</Button>
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
