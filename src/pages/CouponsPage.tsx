import { useState } from "react";
import { mockCoupons, Coupon } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyCoupon: Omit<Coupon, "id"> = { codigo: "", tipo: "percentual", valor: 0, status: true };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyCoupon);

  const openCreate = () => { setEditing(null); setForm(emptyCoupon); setOpen(true); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm(c); setOpen(true); };

  const handleCreate = () => {
    setCoupons((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    setOpen(false);
  };

  const handleUpdate = () => {
    if (!editing) return;
    setCoupons((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)));
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cupons</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Novo Cupom</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.codigo}</TableCell>
                  <TableCell className="capitalize">{c.tipo}</TableCell>
                  <TableCell>{c.tipo === "percentual" ? `${c.valor}%` : `R$ ${c.valor.toFixed(2)}`}</TableCell>
                  <TableCell><Badge variant={c.status ? "default" : "secondary"}>{c.status ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v: "percentual" | "fixo") => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <Label>Ativo</Label>
              <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
            </div>
            <Button className="w-full" onClick={editing ? handleUpdate : handleCreate}>
              {editing ? "Salvar" : "Criar Cupom"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
