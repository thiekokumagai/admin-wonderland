export type ProductImage = {
  id: string;
  url: string;
};

export type ProductVariationLink = {
  id: string;
  variationId: string;
};

export type ProductResponse = {
  id: string;
  title: string;
  categoryId: string;
  images: ProductImage[];
  variationIds: string[];
  itemsCount: number;
};

export type ProductVariationLinkPayload = {
  variationIds: string[];
};

export type ProductItemOption = {
  variationId: string;
  optionId: string;
  optionValue: string;
  variationTitle?: string;
};

export type ProductItem = {
  id: string;
  stock: number;
  sku?: string | null;
  price?: number | null;
  promotionalPrice?: number | null;
  costPrice?: number | null;
  options: ProductItemOption[];
};

export type CreateProductPayload = {
  title: string;
  categoryId: string;
};

export type CreateProductItemPayload = {
  stock: number;
  options?: string[];
  sku?: string;
  price?: number;
  promotionalPrice?: number;
  costPrice?: number;
};

export type UpdateProductItemPayload = {
  stock: number;
};