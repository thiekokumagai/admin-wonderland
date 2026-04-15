import { apiFetch } from "@/services/api";
import type {
  CreateProductItemPayload,
  CreateProductPayload,
  ProductItem,
  ProductResponse,
  UpdateProductItemPayload,
} from "@/types/product";

type ProductApiResponse = {
  id: string;
  title: string;
  categoryId: string;
  images?: Array<{
    id: string;
    url: string;
  }>;
  variations?: Array<{
    id: string;
    variationId: string;
  }>;
  items?: unknown[];
};

type ProductItemApiResponse = {
  id: string;
  stock: number;
  sku?: string | null;
  price?: string | number | null;
  promotionalPrice?: string | number | null;
  costPrice?: string | number | null;
  options?: Array<{
    option: {
      id: string;
      value: string;
      variation?: {
        id: string;
        title: string;
      };
    };
  }>;
};

function toNullableNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeProduct(item: ProductApiResponse): ProductResponse {
  return {
    id: item.id,
    title: item.title,
    categoryId: item.categoryId,
    images: (item.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
    })),
    variationIds: (item.variations ?? []).map((variation) => variation.variationId),
    itemsCount: item.items?.length ?? 0,
  };
}

function normalizeProductItem(item: ProductItemApiResponse): ProductItem {
  return {
    id: item.id,
    stock: item.stock,
    sku: item.sku ?? null,
    price: toNullableNumber(item.price),
    promotionalPrice: toNullableNumber(item.promotionalPrice),
    costPrice: toNullableNumber(item.costPrice),
    options: (item.options ?? []).map((entry) => ({
      variationId: entry.option.variation?.id ?? "",
      variationTitle: entry.option.variation?.title,
      optionId: entry.option.id,
      optionValue: entry.option.value,
    })),
  };
}

export async function getProducts(): Promise<ProductResponse[]> {
  const response = await apiFetch("/products");
  const data = (await response.json()) as ProductApiResponse[];
  return data.map(normalizeProduct);
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductResponse> {
  const response = await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function getProductById(id: string): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}`);
  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function uploadProductImages(productId: string, files: File[]): Promise<ProductResponse> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await apiFetch(`/products/${productId}/images`, {
    method: "POST",
    body,
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiFetch(`/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiFetch(`/products/${productId}`, {
    method: "DELETE",
  });
}

export async function linkProductVariations(productId: string, variationIds: string[]): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${productId}/variations`, {
    method: "POST",
    body: JSON.stringify({
      variationIds,
    }),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function createProductItems(productId: string, items: CreateProductItemPayload[]): Promise<ProductItem[]> {
  const response = await apiFetch(`/products/${productId}/items`, {
    method: "POST",
    body: JSON.stringify({
      items,
    }),
  });

  const data = (await response.json()) as ProductItemApiResponse[];
  return data.map(normalizeProductItem);
}

export async function getProductItems(productId: string): Promise<ProductItem[]> {
  const response = await apiFetch(`/products/${productId}/items`);
  const data = (await response.json()) as ProductItemApiResponse[];
  return data.map(normalizeProductItem);
}

export async function updateProductItem(itemId: string, payload: UpdateProductItemPayload): Promise<ProductItem> {
  const response = await apiFetch(`/products/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductItemApiResponse;
  return normalizeProductItem(data);
}
