import { useEffect,useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

import {
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { createCategory } from "@/services/category.service";
import { buildImageUrl } from "@/utils/image-url";
import type { CategoryList } from "@/types/category";
import {
  categorySchema,
  type CategoryFormData,
} from "@/validations/category.validation";
import { zodResolver } from "@hookform/resolvers/zod";

export default function CategoriesPage() {
  const { data: categories, loading, reload } = useCategories();

  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: "",
      file: null,
    },
  });
  const file = watch("file") as File | null;
  const imagePreview = file ? URL.createObjectURL(file) : "";

  const [localCategories, setLocalCategories] =
    useState<CategoryList[]>([]);

    useEffect(() => {
      setLocalCategories(categories);
    }, [categories]);
  
    const orderedCategories = useMemo(
      () => [...localCategories].sort((a, b) => a.order - b.order),
      [localCategories]
    );

  const handleReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setLocalCategories((prev) => {
      const items = [...prev];

      const fromIndex = items.findIndex((i) => i.id === fromId);
      const toIndex = items.findIndex((i) => i.id === toId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      return items.map((item, index) => ({
        ...item,
        ordem: index + 1,
      }));
    });
  };
  const openCreate = () => {
    reset({
      nome: "",
      file: null,
    });
  
    setOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSaving(true);
  
    try {
      await createCategory({
        nome: data.nome,
        file: data.file ?? null,
      });
  
      reset();
      setOpen(false);
      await reload();
  
      toast({
        title: "Categoria criada",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar categoria",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setValue("file", file);
  };

  const handleDelete = () => {
    toast({
      title: "Delete ainda não implementado",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsRefreshing(true);
              await reload();
              setIsRefreshing(false);
            }}
            disabled={loading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>

          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {orderedCategories.map((c) => (
                  <TableRow
                    key={c.id}
                    draggable
                    onDragStart={() => setDraggingId(c.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingId) handleReorder(draggingId, c.id);
                      setDraggingId(null);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={
                      draggingId === c.id ? "opacity-50" : ""
                    }
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>

                    <TableCell>
                      {c.image ? (
                        <img
                          src={buildImageUrl(c.image)}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted" />
                      )}
                    </TableCell>

                    <TableCell>{c.title}</TableCell>

                    <TableCell>{c.order}</TableCell>

                    <TableCell>
                      <Badge variant={c.deletedAt ? "secondary" : "default"}>
                        {c.deletedAt ? "Inativa" : "Ativa"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                    <button
                      type="button"
                      onClick={() => setValue("file", null)}
                      className="absolute -top-2 -right-2 bg-destructive p-1 rounded-full"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                </div>
              ) : (
                <label className="h-24 w-24 flex items-center justify-center border-2 border-dashed rounded-full cursor-pointer">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            <div>
              <Label>Nome</Label>
              <Input {...register("nome")} />
              {errors.nome && (
                <p className="text-sm text-red-500">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar
            </Button>
            
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}