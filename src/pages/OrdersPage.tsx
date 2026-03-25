import { useState } from "react";
import { mockOrders, Order } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";

const statusConfig: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "destructive" },
  preparo: { label: "Em Preparo", variant: "default" },
  entrega: { label: "Entrega", variant: "secondary" },
  finalizado: { label: "Finalizado", variant: "outline" },
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
        <CardContent className="p-0">
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
                  <TableCell className="font-medium">#{o.id}</TableCell>
                  <TableCell>{o.cliente}</TableCell>
                  <TableCell>R$ {o.total.toFixed(2)}</TableCell>
                  <TableCell>{o.pagamento}</TableCell>
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
            <DialogTitle>Pedido #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selected.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Produtos</p>
                {selected.produtos.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{p.qtd}x {p.nome}</span>
                    <span>R$ {(p.qtd * p.preco).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ {selected.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span>{selected.pagamento}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Alterar Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pendente", "preparo", "entrega", "finalizado"] as Order["status"][]).map((s) => (
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
