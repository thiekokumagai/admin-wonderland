import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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

export default function VariationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewVariation = id === "nova";

  const variationsQuery = useVariations();
  const variations = variationsQuery.data ?? [];
  const [loaded, setLoaded] = useState(false);

  const form = useForm<VariationFormSchema>({
    resolver: zodResolver(variationSchema),
    defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });

  useEffect(() => {
    if (isNewVariation) {
      form.reset(defaultValues);
      replace(defaultValues.options);
      setLoaded(true);
      return;
    }

    const variation = variations.find((item) => item.id === id);

    if (variation) {
      form.reset({
        title: variation.title,
        options: variation.options.length > 0 ? variation.options.map((option) => ({ value: option.value })) : [{ value: "" }],
      });
      setLoaded(true);
    }
  }, [form, id, isNewVariation, replace, variations]);

  const saveMutation = useMutation({
    mutationFn: async (values: VariationFormSchema) => {
      const payload: VariationFormValues = {
        title: values.title,
        options: values.options.map((option) => option.value.trim()),
      };

      if (isNewVariation) {
        return createVariation(payload);
      }

      return updateVariation(id!, payload);
    },
    onSuccess: (variation) => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: isNewVariation ? "Variação criada" : "Variação atualizada" });

      if (isNewVariation) {
        navigate(`/variacoes/${variation.id}`, { replace: true });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar a variação",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVariation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: "Variação removida" });
      navigate("/variacoes", { replace: true });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível remover a variação",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-2 -ml-3">
          <Link to="/variacoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para variações
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{isNewVariation ? "Nova variação" : "Variação"}</h1>
        <p className="text-sm text-muted-foreground">
          Crie ou edite uma variação e suas opções em uma única tela.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNewVariation ? "Cadastrar variação" : "Editar variação"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded && !isNewVariation ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Carregando variação...
            </div>
          ) : (
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
                    {isNewVariation ? "Criar variação" : "Salvar alterações"}
                  </Button>

                  {!isNewVariation ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      Excluir variação
                    </Button>
                  ) : null}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}