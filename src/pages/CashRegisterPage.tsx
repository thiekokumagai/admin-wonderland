import { useState } from "react";
import { mockCashEntries, CashEntry } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Lock, Unlock, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function CashRegisterPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries] = useState<CashEntry[]>(mockCashEntries);

  const totalEntradas = entries.filter((e) => e.tipo === "entrada").reduce((s, e) => s + e.valor, 0);
  const totalSaidas = entries.filter((e) => e.tipo === "saida").reduce((s, e) => s + e.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const handleOpenCash = () => setIsOpen(true);
  const handleCloseCash = () => setIsOpen(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caixa</h1>

      <div className="flex gap-3">
        <Button onClick={handleOpenCash} disabled={isOpen} className="gap-2">
          <Unlock className="h-4 w-4" /> Abrir Caixa
        </Button>
        <Button onClick={handleCloseCash} disabled={!isOpen} variant="destructive" className="gap-2">
          <Lock className="h-4 w-4" /> Fechar Caixa
        </Button>
        <Badge variant={isOpen ? "default" : "secondary"} className="flex items-center text-sm px-3">
          {isOpen ? "Caixa Aberto" : "Caixa Fechado"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <ArrowUpCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="text-lg font-bold">R$ {totalEntradas.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <ArrowDownCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Saídas</p>
              <p className="text-lg font-bold">R$ {totalSaidas.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold">R$ {saldo.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant={e.tipo === "entrada" ? "default" : "destructive"}>
                      {e.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell>{e.descricao}</TableCell>
                  <TableCell className={e.tipo === "entrada" ? "text-success font-medium" : "text-destructive font-medium"}>
                    {e.tipo === "entrada" ? "+" : "-"} R$ {e.valor.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{e.data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
