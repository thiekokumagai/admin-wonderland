export type CategoryList = {
    id: string;
    title: string;
    image: string | null;
    order: number | null;
    deletedAt: string | null;
};
export type CreateCategoryDTO = {
    nome: string;
    file: File | null;
  };