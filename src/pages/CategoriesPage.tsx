import { useState } from "react";
import { mockCategories, CategoryImage } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";

const emptyCategory: Omit<CategoryImage, "id"> = { nome: "", imagem: "", produtosAtivos: 0, ordem: 0, status: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryImage[]>(mockCategories);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryImage | null>(null);
  const [form, setForm] = useState<Omit<CategoryImage, "id">>(emptyCategory);
  const [imagePreview, setImagePreview] = useState("");

  const openCreate = () => { setEditing(null); setForm(emptyCategory); setImagePreview(""); setOpen(true); };
  const openEdit = (c: CategoryImage) => { setEditing(c); setForm(c); setImagePreview(c.imagem || ""); setOpen(true); };

  const handleCreate = () => {
    setCategories((prev) => [...prev, { ...form, imagem: imagePreview, id: Date.now().toString() }]);
    setOpen(false);
  };

  const handleUpdate = () => {
    if (!editing) return;
    setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...form, imagem: imagePreview } : c)));
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Categoria</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.imagem ? (
                      <img src={c.imagem} alt={c.nome} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted" />
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
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                  <button onClick={() => setImagePreview("")} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
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
              <Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} />
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
