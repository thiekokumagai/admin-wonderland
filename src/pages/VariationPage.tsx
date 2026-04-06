import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useVariations } from "@/hooks/useVariations";
import { createVariation, deleteVariation, updateVariation } from "@/services/variation.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import type { VariationFormValues } from "@/types/variation";

const variationSchema = z.object({
  title: z.string().min(1, "Informe o nome da variação."),
  options: z
    .array(
      z.object({
        value: z.string().min(1, "A opção não pode ficar vazia."),
      }),
    )
    .min(1, "Adicione pelo menos uma opção."),
});

type VariationFormSchema = z.infer<typeof variationSchema>;

const defaultValues: VariationFormSchema = {
  title: "",
  options: [{ value: "" }],
};

export default function VariationPage() {
  const queryClient = useQueryClient();
  const variationsQuery = useVariations();
  const variations = variationsQuery.data ?? [];
  const isLoading = variationsQuery.isLoading;
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<VariationFormSchema>({
    resolver: zodResolver(variationSchema),
    defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const saveMutation = useMutation({
    mutationFn: async (values: VariationFormSchema) => {
      const payload: VariationFormValues = {
        title: values.title,
        options: values.options.map((option) => option.value.trim()),
      };

      if (editingId) {
        return updateVariation(editingId, payload);
      }

      return createVariation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: editingId ? "Variação atualizada" : "Variação criada" });
      setEditingId(null);
      form.reset(defaultValues);
      replace(defaultValues.options);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar a variação",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVariation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: "Variação removida" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível remover a variação",
      });
    },
  });

  const orderedVariations = useMemo(() => variations, [variations]);

  const handleEdit = (id: string) => {
    const variation = variations.find((item) => item.id === id);
    if (!variation) return;

    setEditingId(id);
    form.reset({
      title: variation.title,
      options: variation.options.length > 0 ? variation.options.map((option) => ({ value: option.value })) : [{ value: "" }],
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset(defaultValues);
    replace(defaultValues.options);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Variações</h1>
        <p className="text-sm text-muted-foreground">Crie e mantenha as variações disponíveis para seus produtos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar variação" : "Nova variação"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da variação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Nicotina, Sabor, Tamanho" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Opções</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar opção
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}.value`}
                    render={({ field: optionField }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder={`Opção ${index + 1}`} {...optionField} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {editingId ? "Salvar alterações" : "Criar variação"}
                </Button>

                {editingId ? (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variações cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Carregando variações...
            </div>
          ) : orderedVariations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma variação cadastrada ainda.
            </div>
          ) : (
            orderedVariations.map((variation) => (
              <div key={variation.id} className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{variation.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {variation.options.map((option) => option.value).join(", ") || "Sem opções"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variation.id)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(variation.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}