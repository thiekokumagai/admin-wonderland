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
};

type ProductItemApiResponse = {
  id: string;
  stock: number;
  options: Array<{
    variationId: string;
    optionId: string;
    optionValue: string;
  }>;
};

function normalizeProduct(item: ProductApiResponse): ProductResponse {
  return {
    id: item.id,
    title: item.title,
    categoryId: item.categoryId,
  };
}

function normalizeProductItem(item: ProductItemApiResponse): ProductItem {
  return {
    id: item.id,
    stock: item.stock,
    options: item.options ?? [],
  };
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

export async function linkProductVariations(productId: string, variationIds: string[]): Promise<void> {
  await apiFetch(`/products/${productId}/variations`, {
    method: "POST",
    body: JSON.stringify({
      variationIds,
    }),
  });
}

export async function createProductItems(productId: string, items: CreateProductItemPayload[]): Promise<void> {
  await apiFetch(`/products/${productId}/items`, {
    method: "POST",
    body: JSON.stringify({
      items,
    }),
  });
}

export async function getProductItems(productId: string): Promise<ProductItem[]> {
  const response = await apiFetch(`/products/${productId}/items`);
  const data = (await response.json()) as ProductItemApiResponse[];
  return data.map(normalizeProductItem);
}

export async function updateProductItem(itemId: string, payload: UpdateProductItemPayload): Promise<void> {
  await apiFetch(`/products/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}