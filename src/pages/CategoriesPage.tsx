import { useMemo, useState } from "react";
import { mockCategories, CategoryImage } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GripVertical, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

const emptyCategory: Omit<CategoryImage, "id"> = { nome: "", imagem: "", produtosAtivos: 0, ordem: 0, status: true };

const sortCategories = (items: CategoryImage[]) => [...items].sort((a, b) => a.ordem - b.ordem);

const normalizeOrder = (items: CategoryImage[]) =>
  items.map((item, index) => ({
    ...item,
    ordem: index + 1,
  }));

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryImage[]>(sortCategories(mockCategories));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryImage | null>(null);
  const [form, setForm] = useState<Omit<CategoryImage, "id">>(emptyCategory);
  const [imagePreview, setImagePreview] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderedCategories = useMemo(() => sortCategories(categories), [categories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyCategory, ordem: orderedCategories.length + 1 });
    setImagePreview("");
    setOpen(true);
  };

  const openEdit = (c: CategoryImage) => {
    setEditing(c);
    setForm(c);
    setImagePreview(c.imagem || "");
    setOpen(true);
  };

  const handleCreate = () => {
    const nextCategory: CategoryImage = {
      ...form,
      imagem: imagePreview,
      id: Date.now().toString(),
      ordem: orderedCategories.length + 1,
    };

    setCategories((prev) => normalizeOrder([...sortCategories(prev), nextCategory]));
    setOpen(false);
  };

  const handleUpdate = () => {
    if (!editing) return;

    setCategories((prev) =>
      normalizeOrder(
        sortCategories(
          prev.map((c) => (c.id === editing.id ? { ...editing, ...form, imagem: imagePreview } : c)),
        ),
      ),
    );
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => normalizeOrder(sortCategories(prev.filter((c) => c.id !== id))));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

      return normalizeOrder(reordered);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Arraste as linhas para alterar a ordem de exibição.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova Categoria</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Produtos</TableHead>
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
                  <TableCell>{c.produtosAtivos}</TableCell>
                  <TableCell><Badge variant={c.status ? "default" : "secondary"}>{c.status ? "Ativa" : "Inativa"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-full border-2 border-primary object-cover" />
                  <button onClick={() => setImagePreview("")} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
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
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} disabled />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
              <Label>Ativa</Label>
            </div>
            <Button className="w-full" onClick={editing ? handleUpdate : handleCreate}>
              {editing ? "Salvar" : "Criar Categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
