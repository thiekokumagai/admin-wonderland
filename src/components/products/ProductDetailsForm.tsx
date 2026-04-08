import { Save } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryList } from "@/types/category";

export type ProductDetailsFormValues = {
  title: string;
  categoryId: string;
};

type ProductDetailsFormProps = {
  form: UseFormReturn<ProductDetailsFormValues>;
  categories: CategoryList[];
  onSubmit: (values: ProductDetailsFormValues) => void;
  isSaving: boolean;
  productId: string | null;
};

export function ProductDetailsForm({
  form,
  categories,
  onSubmit,
  isSaving,
  productId,
}: ProductDetailsFormProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Dados do produto</CardTitle>
        <CardDescription>Escolha a categoria e preencha o título. A galeria fica logo abaixo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-2xl" placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      <div className="flex justify-end px-6 pb-6">
        <Button
          type="button"
          className="rounded-xl px-6"
          disabled={isSaving}
          onClick={form.handleSubmit(onSubmit)}
        >
          <Save className="mr-2 h-4 w-4" />
          {productId ? "Salvar produto" : "Criar produto"}
        </Button>
      </div>
    </Card>
  );
}
