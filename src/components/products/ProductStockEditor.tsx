import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductItem } from "@/types/product";

type ProductStockEditorProps = {
  productReady: boolean;
  hasVariations: boolean;
  loadingSavedItems: boolean;
  savedItems: ProductItem[];
  stockDrafts: Record<string, string>;
  isSaving: boolean;
  onValueChange: (itemId: string, value: string) => void;
  onSaveAll: () => void;
};

function renderSavedItemLabel(item: ProductItem) {
  return item.options.map((option) => option.optionValue).join(" / ");
}

export function ProductStockEditor({
  productReady,
  hasVariations,
  loadingSavedItems,
  savedItems,
  stockDrafts,
  isSaving,
  onValueChange,
  onSaveAll,
}: ProductStockEditorProps) {
  return (
    <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Estoque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!productReady ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Crie o produto antes de configurar o estoque.
          </div>
        ) : !hasVariations ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Salve as variações para gerar os itens com estoque zero.
          </div>
        ) : loadingSavedItems ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Carregando itens...
          </div>
        ) : savedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum item gerado ainda.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {savedItems.map((item) => {
                const draftValue = stockDrafts[item.id] ?? String(item.stock);
                const parsedValue = Number(draftValue);
                const preview = Number.isNaN(parsedValue) ? item.stock : parsedValue;

                return (
                  <div key={item.id} className="grid gap-3 rounded-2xl bg-card p-4 md:grid-cols-[1fr_180px_220px] md:items-end">
                    <div>
                      <p className="font-medium">{renderSavedItemLabel(item)}</p>
                      <p className="text-sm text-muted-foreground">Atual: {item.stock}</p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">Quantidade</p>
                      <Input
                        type="number"
                        min="0"
                        value={draftValue}
                        onChange={(event) => onValueChange(item.id, event.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                      Resultado previsto: <span className="font-medium text-foreground">{preview}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={onSaveAll} disabled={isSaving}>
                Salvar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}