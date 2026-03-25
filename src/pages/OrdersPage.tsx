import { useState } from "react";
import { mockOrders, Order } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Phone, MapPin } from "lucide-react";

const statusConfig: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "destructive" },
  preparo: { label: "Em Preparo", variant: "default" },
  entrega: { label: "Entrega", variant: "secondary" },
  finalizado: { label: "Finalizado", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selected, setSelected] = useState<Order | null>(null);

  const handleUpdateStatus = (id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-medium text-xs">{o.id}</TableCell>
                  <TableCell>{o.cliente}</TableCell>
                  <TableCell>R$ {o.total.toFixed(2)}</TableCell>
                  <TableCell>{paymentLabels[o.pagamento]}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[o.status].variant}>{statusConfig[o.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.data}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setSelected(o)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pedido {selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-semibold">{selected.cliente}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{selected.telefone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{selected.endereco}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Produtos</p>
                {selected.produtos.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span>{p.qtd}x {p.nome}</span>
                      {p.variacao && <span className="text-muted-foreground text-xs ml-1">({p.variacao})</span>}
                    </div>
                    <span className="shrink-0">R$ {(p.qtd * p.preco).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {selected.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {selected.taxaEntrega.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>R$ {selected.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <Badge variant="outline">{paymentLabels[selected.pagamento]}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Alterar Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pendente", "preparo", "entrega", "finalizado", "cancelado"] as Order["status"][]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      onClick={() => {
                        handleUpdateStatus(selected.id, s);
                        setSelected({ ...selected, status: s });
                      }}
                    >
                      {statusConfig[s].label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
