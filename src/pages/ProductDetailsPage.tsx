import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash2 } from "lucide-react";
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
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedVariationIds, setSelectedVariationIds] = useState<string[]>([]);
  const [selectedOptionsByVariation, setSelectedOptionsByVariation] = useState<Record<string, string>>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [stockDraftByHash, setStockDraftByHash] = useState<Record<string, string>>({});

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
      toast({ title: "Produto criado" });
      navigate(`/produtos/${product.id}`, { replace: true });
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

  const removeSavedItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => updateProductItem(itemId, { stock: 0 }),
    onSuccess: async () => {
      await refetchItems();
      toast({ title: "Estoque do item atualizado para 0" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Não foi possível atualizar o item" });
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

  const handleSaveProduct = (values: ProductDetailsFormValues) => {
    if (productId) {
      toast({ title: "Os dados principais já estão criados para este produto." });
      return;
    }

    createProductMutation.mutate(values);
  };

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

  const handleUploadImages = () => {
    if (!productId) {
      toast({ variant: "destructive", title: "Crie o produto antes de enviar imagens" });
      return;
    }

    if (pendingImages.length === 0) {
      toast({ variant: "destructive", title: "Selecione ao menos uma imagem" });
      return;
    }

    uploadImagesMutation.mutate({
      currentProductId: productId,
      files: pendingImages.map((image) => image.file),
    });
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
      return `${variation.title}: ${option?.value ?? ""}`;
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

  const renderSavedItemLabel = (item: ProductItem) =>
    item.options
      .map((option) => `${option.variationTitle ?? "Variação"}: ${option.optionValue}`)
      .join(" / ");

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
            Cadastre produto, envie múltiplas fotos com crop e defina estoque por variação.
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

      <ProductImageManager
        images={images}
        pendingImages={pendingImages}
        isUploading={uploadImagesMutation.isPending}
        isDeletingImage={deleteImageMutation.isPending}
        canUpload={!!productId && pendingImages.length > 0}
        onPendingImagesChange={handlePendingImagesChange}
        onRemovePendingImage={handleRemovePendingImage}
        onUpload={handleUploadImages}
        onDeleteImage={(imageId) => {
          if (!productId) {
            return;
          }
          deleteImageMutation.mutate({ currentProductId: productId, imageId });
        }}
      />

      <ProductVariationSelector
        variations={variations}
        selectedVariationIds={selectedVariationIds}
        onToggle={handleToggleVariation}
        onSave={handleSaveVariationLinks}
        isSaving={linkVariationsMutation.isPending}
        disabled={!productId}
      />

      <Card>
        <CardHeader>
          <CardTitle>4. Estoque por variação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!productId ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Crie o produto antes de configurar o estoque.
            </div>
          ) : selectedVariations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Se o produto tiver variação, vincule as variações acima.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selectedVariations.map((variation) => (
                  <div key={variation.id} className="rounded-xl border p-4 space-y-3">
                    <Label>{variation.title}</Label>
                    <div className="space-y-2">
                      {variation.options.map((option) => {
                        const checked = selectedOptionsByVariation[variation.id] === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectVariationOption(variation.id, option.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              checked ? "border-primary bg-primary/5" : "hover:bg-muted"
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

              <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                <div className="space-y-2">
                  <Label>Quantidade em estoque da combinação</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stockDraftByHash[buildOptionHash(selectedOptionIds)] ?? ""}
                    onChange={(event) =>
                      setStockDraftByHash((prev) => ({
                        ...prev,
                        [buildOptionHash(selectedOptionIds)]: event.target.value,
                      }))
                    }
                    placeholder="0"
                    disabled={!canCreateCombination}
                  />
                </div>
                <Button type="button" onClick={handleAddDraftItem} disabled={!canCreateCombination}>
                  Adicionar combinação
                </Button>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold">Combinações prontas para salvar</h3>
                  {draftItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      Nenhuma combinação adicionada ainda.
                    </div>
                  ) : (
                    draftItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                          <p className="font-medium">{item.labels.join(" / ")}</p>
                          <p className="text-sm text-muted-foreground">Estoque: {item.stock}</p>
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
                    <Button type="button" onClick={handleSaveAllItems} disabled={draftItems.length === 0 || saveItemsMutation.isPending}>
                      Salvar combinações
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Itens já salvos</h3>
                  {loadingSavedItems ? (
                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      Carregando itens...
                    </div>
                  ) : savedItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      Nenhum item salvo ainda.
                    </div>
                  ) : (
                    savedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                          <p className="font-medium">{renderSavedItemLabel(item)}</p>
                          <p className="text-sm text-muted-foreground">Estoque: {item.stock}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSavedItemMutation.mutate({ itemId: item.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
