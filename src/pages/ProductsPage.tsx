import { useState } from "react";
import { mockProducts, mockCategories, Product } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, X, ImagePlus } from "lucide-react";

const emptyProduct: Omit<Product, "id"> = {
  descricao: "", preco: 0, categoria: "", status: true, detalhes: "", imagens: [], videoYoutube: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);

  const openCreate = () => { setEditing(null); setForm(emptyProduct); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setOpen(true); };

  const handleCreate = () => {
    const newP: Product = { ...form, id: Date.now().toString() };
    setProducts((prev) => [...prev, newP]);
    setOpen(false);
  };

  const handleUpdate = () => {
    if (!editing) return;
    setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentImages = form.imagens.length;
    const remaining = 6 - currentImages;
    const toAdd = Array.from(files).slice(0, remaining);
    const urls = toAdd.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({ ...prev, imagens: [...prev.imagens, ...urls] }));
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, imagens: prev.imagens.filter((_, i) => i !== idx) }));
  };

  const getCategoryName = (id: string) => mockCategories.find((c) => c.id === id)?.nome || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Novo Produto</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.descricao}</TableCell>
                  <TableCell>R$ {p.preco.toFixed(2)}</TableCell>
                  <TableCell>{getCategoryName(p.categoria)}</TableCell>
                  <TableCell><Badge variant={p.status ? "default" : "secondary"}>{p.status ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.detalhes} onChange={(e) => setForm({ ...form, detalhes: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço</Label>
                <Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label>Ativo</Label>
              <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
            </div>
            <div>
              <Label>Imagens (máx. 6)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.imagens.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-foreground/70 text-background rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {form.imagens.length < 6 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Vídeo YouTube</Label>
              <Input placeholder="https://youtube.com/..." value={form.videoYoutube} onChange={(e) => setForm({ ...form, videoYoutube: e.target.value })} />
            </div>
            <Button className="w-full" onClick={editing ? handleUpdate : handleCreate}>
              {editing ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
