export type ProductResponse = {
  id: string;
  title: string;
  categoryId: string;
  variationIds: string[];
};

export type ProductVariationLinkPayload = {
  variationIds: string[];
};

export type ProductItemOption = {
  variationId: string;
  optionId: string;
  optionValue: string;
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
  options: {
    variationId: string;
    optionId: string;
  }[];
};

export type UpdateProductItemPayload = {
  stock: number;
};