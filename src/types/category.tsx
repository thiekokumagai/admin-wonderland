export type CategoryList = {
    id: string;
    title: string;
    image: string | null;
    order: number | null;
    isVisible: boolean;
    deletedAt: string | null;
};
export type CreateCategoryDTO = {
    title: string;
    isVisible: boolean;
    file: File | null;
  };

  export type UpdateCategoryDTO = {
    title?: string;
    file?: File | null;
    isVisible?: boolean;
    removeImage?: boolean;
  };