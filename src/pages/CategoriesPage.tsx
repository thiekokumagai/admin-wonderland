import { useEffect, useMemo, useState } from "react";
import { CategoryImage } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { GripVertical, ImagePlus, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";

const API_BASE_URL = "https://ecommerce-core-api-production-3cc7.up.railway.app/api";
const LOGIN_EMAIL = "admin@admin.com";
const LOGIN_PASSWORD = "admin123";
const FILE_BASE_URL = "https://ecommerce-core-api-production-3cc7.up.railway.app/";

type ApiCategory = {
  id: string;
  title: string;
  image: string | null;
  deletedAt: string | null;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

type CategoryFormState = {
  nome: string;
  file: File | null;
};

const emptyCategory: CategoryFormState = { nome: "", file: null };

const sortCategories = (items: CategoryImage[]) => [...items].sort((a, b) => a.ordem - b.ordem);

const buildImageUrl = (imagePath: string | null) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${FILE_BASE_URL}${imagePath}`;
};

const mapApiCategory = (category: ApiCategory, index: number): CategoryImage => ({
  id: category.id,
  nome: category.title,
  imagem: buildImageUrl(category.image),
  produtosAtivos: 0,
  ordem: index + 1,
  status: !category.deletedAt,
});

async function loginAndGetAccessToken() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível autenticar na API.");
  }

  const data = (await response.json()) as LoginResponse;
  return data.accessToken;
}

async function fetchCategories(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as categorias.");
  }

  const data = (await response.json()) as ApiCategory[];
  return data.map(mapApiCategory);
}

async function createCategory(accessToken: string, form: CategoryFormState) {
  const body = new FormData();
  body.append("title", form.nome.trim());

  if (form.file) {
    body.append("file", form.file);
  }

  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Não foi possível criar a categoria.");
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryImage[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyCategory);
  const [imagePreview, setImagePreview] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const orderedCategories = useMemo(() => sortCategories(categories), [categories]);

  const loadCategories = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = await loginAndGetAccessToken();
      setAccessToken(token);
      const nextCategories = await fetchCategories(token);
      setCategories(sortCategories(nextCategories));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const openCreate = () => {
    setForm(emptyCategory);
    setImagePreview("");
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!form.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Informe o nome da categoria antes de salvar.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = accessToken ?? (await loginAndGetAccessToken());
      setAccessToken(token);
      await createCategory(token, form);
      setOpen(false);
      setForm(emptyCategory);
      setImagePreview("");
      await loadCategories(true);
      toast({
        title: "Categoria criada",
        description: "A lista foi atualizada com os dados da API.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar categoria",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    toast({
      title: "Exclusão indisponível",
      description: "A API enviada inclui listagem e criação. Posso conectar exclusão quando você me passar o endpoint.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setCategories((prev) => {
      const sorted = sortCategories(prev);
      const fromIndex = sorted.findIndex((item) => item.id === fromId);
      const toIndex = sorted.findIndex((item) => item.id === toId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...sorted];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      return reordered.map((item, index) => ({ ...item, ordem: index + 1 }));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Dados carregados da API. Arraste as linhas para reorganizar visualmente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadCategories(true)} disabled={isRefreshing || isLoading}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova Categoria</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedCategories.map((c) => (
                  <TableRow
                    key={c.id}
                    draggable
                    onDragStart={() => setDraggingId(c.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingId) handleReorder(draggingId, c.id);
                      setDraggingId(null);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={draggingId === c.id ? "opacity-50" : undefined}
                  >
                    <TableCell>
                      <button
                        type="button"
                        className="cursor-grab text-muted-foreground active:cursor-grabbing"
                        aria-label={`Arrastar ${c.nome}`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell>
                      {c.imagem ? (
                        <img src={c.imagem} alt={c.nome} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.ordem}</TableCell>
                    <TableCell><Badge variant={c.status ? "default" : "secondary"}>{c.status ? "Ativa" : "Inativa"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {orderedCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                )}
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
            <div className="flex flex-col items-center gap-2">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-full border-2 border-primary object-cover" />
                  <button type="button" onClick={() => {
                    setImagePreview("");
                    setForm((prev) => ({ ...prev, file: null }));
                  }} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors hover:border-primary">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              <span className="text-xs text-muted-foreground">Imagem da categoria</span>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => void handleCreate()} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar Categoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
