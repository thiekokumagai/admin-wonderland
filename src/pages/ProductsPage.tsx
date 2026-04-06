import { useState } from "react";
import { mockProducts, mockCategories, Product, ProductVariation, ProductVariationOption, ProductPromotion } from "@/data/mock-data";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, X, ImagePlus, Star, Eye, EyeOff } from "lucide-react";

const emptyProduct: Omit<Product, "id"> = {
  descricao: "", preco: 0, categorias: [], categorias_nomes: [], exibir: true, destaque: false,
  detalhes: "", imagens: [], videoYoutube: "", unidadeVenda: "Unidade", codigo: "",
  promocao: null, variacoes: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);

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
    const remaining = 6 - form.imagens.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const urls = toAdd.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({ ...prev, imagens: [...prev.imagens, ...urls] }));
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, imagens: prev.imagens.filter((_, i) => i !== idx) }));
  };

  const handleCategoryChange = (catId: string) => {
    const cat = mockCategories.find((c) => c.id === catId);
    if (!cat) return;
    setForm((prev) => ({
      ...prev,
      categorias: [catId],
      categorias_nomes: [cat.title],
    }));
  };

  const togglePromo = (enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      promocao: enabled ? { existe: true, percentual: 10, precoPromocional: prev.preco * 0.9 } : null,
    }));
  };

  const updatePromo = (field: keyof ProductPromotion, value: number | string) => {
    setForm((prev) => {
      if (!prev.promocao) return prev;
      const updated = { ...prev.promocao, [field]: value };
      if (field === "percentual") {
        updated.precoPromocional = prev.preco * (1 - (Number(value) / 100));
      }
      return { ...prev, promocao: updated };
    });
  };

  // Variation management
  const addVariation = () => {
    const newVar: ProductVariation = {
      id: `var-${Date.now()}`, nome: "", obrigatoria: true, multipla_selecao: false, adicional: false, options: [],
    };
    setForm((prev) => ({ ...prev, variacoes: [...prev.variacoes, newVar] }));
  };

  const updateVariation = (idx: number, field: keyof ProductVariation, value: any) => {
    setForm((prev) => ({
      ...prev,
      variacoes: prev.variacoes.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));
  };

  const removeVariation = (idx: number) => {
    setForm((prev) => ({ ...prev, variacoes: prev.variacoes.filter((_, i) => i !== idx) }));
  };

  const addOption = (varIdx: number) => {
    const newOpt: ProductVariationOption = { id: `opt-${Date.now()}`, label: "", preco: 0, available: true, quantidade: 0 };
    setForm((prev) => ({
      ...prev,
      variacoes: prev.variacoes.map((v, i) =>
        i === varIdx ? { ...v, options: [...v.options, newOpt] } : v
      ),
    }));
  };

  const updateOption = (varIdx: number, optIdx: number, field: keyof ProductVariationOption, value: any) => {
    setForm((prev) => ({
      ...prev,
      variacoes: prev.variacoes.map((v, i) =>
        i === varIdx
          ? { ...v, options: v.options.map((o, j) => (j === optIdx ? { ...o, [field]: value } : o)) }
          : v
      ),
    }));
  };

  const removeOption = (varIdx: number, optIdx: number) => {
    setForm((prev) => ({
      ...prev,
      variacoes: prev.variacoes.map((v, i) =>
        i === varIdx ? { ...v, options: v.options.filter((_, j) => j !== optIdx) } : v
      ),
    }));
  };

  const getCategoryName = (ids: string[]) => {
    return ids.map((id) => mockCategories.find((c) => c.id === id)?.title).filter(Boolean).join(", ") || "—";
  };

  const totalVariations = (p: Product) => p.variacoes.reduce((s, v) => s + v.options.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Novo Produto</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Variações</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className={!p.exibir ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.destaque && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
                      <span className="font-medium">{p.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.codigo || "—"}</TableCell>
                  <TableCell>
                    {p.promocao?.existe ? (
                      <div>
                        <span className="line-through text-muted-foreground text-xs mr-1">R$ {p.preco.toFixed(2)}</span>
                        <span className="text-primary font-semibold">R$ {p.promocao.precoPromocional?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>R$ {p.preco.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{getCategoryName(p.categorias)}</TableCell>
                  <TableCell>
                    {totalVariations(p) > 0 ? (
                      <Badge variant="secondary">{totalVariations(p)} opções</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.exibir ? (
                        <Badge variant="default"><Eye className="h-3 w-3 mr-1" />Visível</Badge>
                      ) : (
                        <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Oculto</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="geral" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="geral" className="flex-1">Geral</TabsTrigger>
              <TabsTrigger value="variacoes" className="flex-1">Variações</TabsTrigger>
              <TabsTrigger value="midia" className="flex-1">Mídia</TabsTrigger>
              <TabsTrigger value="promo" className="flex-1">Promoção</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              <div>
                <Label>Nome do Produto</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <Label>Descrição / Detalhes</Label>
                <Textarea value={form.detalhes} onChange={(e) => setForm({ ...form, detalhes: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Código (SKU)</Label>
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categorias[0] || ""} onValueChange={handleCategoryChange}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {mockCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}

                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidade de Venda</Label>
                  <Select value={form.unidadeVenda} onValueChange={(v) => setForm({ ...form, unidadeVenda: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Unidade", "Caixa", "Pacote", "Peça", "Quilo", "Porção", "Par"].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.exibir} onCheckedChange={(v) => setForm({ ...form, exibir: v })} />
                  <Label>Visível na loja</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} />
                  <Label>Destaque</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variacoes" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Ex: Sabor, Cor, Nicotina — cada variação pode ter diversas opções com preço adicional e controle de estoque.
              </p>
              {form.variacoes.map((v, vi) => (
                <Card key={v.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Nome da variação (ex: Sabor)"
                        value={v.nome}
                        onChange={(e) => updateVariation(vi, "nome", e.target.value)}
                        className="max-w-[200px]"
                      />
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeVariation(vi)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Switch checked={v.obrigatoria} onCheckedChange={(val) => updateVariation(vi, "obrigatoria", val)} />
                        <span className="text-xs">Obrigatória</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={v.multipla_selecao} onCheckedChange={(val) => updateVariation(vi, "multipla_selecao", val)} />
                        <span className="text-xs">Múltipla seleção</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={v.adicional} onCheckedChange={(val) => updateVariation(vi, "adicional", val)} />
                        <span className="text-xs">Adicional</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {v.options.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <Input placeholder="Nome" value={opt.label} onChange={(e) => updateOption(vi, oi, "label", e.target.value)} className="flex-1" />
                          <Input type="number" step="0.01" placeholder="R$" value={opt.preco} onChange={(e) => updateOption(vi, oi, "preco", Number(e.target.value))} className="w-20" />
                          <Input type="number" placeholder="Qtd" value={opt.quantidade} onChange={(e) => updateOption(vi, oi, "quantidade", Number(e.target.value))} className="w-20" />
                          <Switch checked={opt.available} onCheckedChange={(val) => updateOption(vi, oi, "available", val)} />
                          <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removeOption(vi, oi)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(vi)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />Adicionar opção
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addVariation}>
                <Plus className="h-4 w-4 mr-1" />Nova Variação
              </Button>
            </TabsContent>

            <TabsContent value="midia" className="space-y-4 mt-4">
              <div>
                <Label>Imagens (máx. 6)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.imagens.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.imagens.length < 6 && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <Label>Vídeo YouTube</Label>
                <Input placeholder="https://youtube.com/watch?v=..." value={form.videoYoutube} onChange={(e) => setForm({ ...form, videoYoutube: e.target.value })} />
              </div>
            </TabsContent>

            <TabsContent value="promo" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch checked={!!form.promocao?.existe} onCheckedChange={togglePromo} />
                <Label>Ativar Promoção</Label>
              </div>
              {form.promocao?.existe && (
                <div className="space-y-4 pl-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Percentual (%)</Label>
                      <Input
                        type="number"
                        value={form.promocao.percentual || 0}
                        onChange={(e) => updatePromo("percentual", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Preço Promocional</Label>
                      <Input type="number" step="0.01" value={form.promocao.precoPromocional?.toFixed(2) || ""} readOnly className="bg-muted" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início</Label>
                      <Input type="datetime-local" value={form.promocao.dataHoraInicio || ""} onChange={(e) => updatePromo("dataHoraInicio", e.target.value)} />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input type="datetime-local" value={form.promocao.dataHoraFim || ""} onChange={(e) => updatePromo("dataHoraFim", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button className="w-full mt-4" onClick={editing ? handleUpdate : handleCreate}>
            {editing ? "Salvar Alterações" : "Cadastrar Produto"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
