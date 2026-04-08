export type ProductImage = {
  id: string;
  url: string;
};

export type ProductVariationLink = {
  id: string;
  variationId: string;
};

export type SavedProductVariationOption = {
  id: string;
  value: string;
};

export type SavedProductVariation = {
  id: string;
  variationId: string;
  title: string;
  options: SavedProductVariationOption[];
};

export type ProductResponse = {
  id: string;
  title: string;
  categoryId: string;
  images: ProductImage[];
  variationIds: string[];
  variations: SavedProductVariation[];
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
  options: ProductItemOption[];
};

export type CreateProductPayload = {
  title: string;
  categoryId: string;
};

export type CreateProductItemPayload = {
  stock: number;
  options: string[];
};

export type UpdateProductItemPayload = {
  stock: number;
};

export type RemoveProductVariationPayload = {
  variationId: string;
};

export type RemoveProductVariationOptionPayload = {
  variationId: string;
  optionId: string;
};