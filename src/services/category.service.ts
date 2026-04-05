import { apiFetch } from "./api";
import type { CategoryList,CreateCategoryDTO } from "@/types/category";


export async function getCategories(): Promise<CategoryList[]> {
  const response = await apiFetch("/categories");
  return response.json();
}

export async function createCategory(
  form: CreateCategoryDTO
): Promise<void> {
  const body = new FormData();
  body.append("title", form.title.trim());
  if (form.file) {
    body.append("file", form.file);
  }
  body.append("isVisible", form.isVisible ? "true" : "false");
  await apiFetch("/categories", {
    method: "POST",
    body,
  });
}
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, {
    method: "DELETE",
  });
}