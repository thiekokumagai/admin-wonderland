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
  body.append("title", form.nome.trim());
  if (form.file) {
    body.append("file", form.file);
  }

  await apiFetch("/categories", {
    method: "POST",
    body,
  });
}