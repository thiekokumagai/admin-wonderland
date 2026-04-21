import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import type { CategoryList } from "@/types/category";

export type ProductDetailsFormValues = {
  title: string;
  categoryId: string;
  description?: string;
  descriptionFormated?: string;
  price?: number;
  promotionalPrice?: number;
  costPrice?: number;
};

type ProductDetailsFormProps = {
  form: UseFormReturn<ProductDetailsFormValues>;
  categories: CategoryList[];
  onSubmit: (values: ProductDetailsFormValues) => void;
};

export function ProductDetailsForm({
  form,
  categories,
  onSubmit,
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Suporta HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px] rounded-2xl"
                      placeholder="Descreva o produto..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 md:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (Venda)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <NumericFormat
                          customInput={Input}
                          decimalSeparator=","
                          thousandSeparator="."
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          className="h-12 rounded-2xl pl-9"
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.floatValue);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promotionalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Promocional</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <NumericFormat
                          customInput={Input}
                          decimalSeparator=","
                          thousandSeparator="."
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          className="h-12 rounded-2xl pl-9"
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.floatValue);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <NumericFormat
                          customInput={Input}
                          decimalSeparator=","
                          thousandSeparator="."
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          className="h-12 rounded-2xl pl-9"
                          placeholder="0,00"
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.floatValue);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
