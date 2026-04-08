import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductItem } from "@/types/product";

export type QuickEditMode = "add" | "subtract" | "replace";

type ProductStockEditorProps = {
  productReady: boolean;
  hasVariations: boolean;
  loadingSavedItems: boolean;
  savedItems: ProductItem[];
  bulkMode: QuickEditMode;
  bulkValues: Record<string, string>;
  isSaving: boolean;
  onModeChange: (mode: QuickEditMode) => void;
  onValueChange: (itemId: string, value: string) => void;
  onSaveAll: () => void;
};

function getNextStock(currentStock: number, value: number, mode: QuickEditMode) {
  if (mode === "add") {
    return currentStock + value;
  }

  if (mode === "subtract") {
    return Math.max(0, currentStock - value);
  }

  return value;
}

function renderSavedItemLabel(item: ProductItem) {
  return item.options.map((option) => option.optionValue).join(" / ");
}

export function ProductStockEditor({
  productReady,
  hasVariations,
  loadingSavedItems,
  savedItems,
  bulkMode,
  bulkValues,
  isSaving,
  onModeChange,
  onValueChange,
  onSaveAll,
}: ProductStockEditorProps) {
  return (
    <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
      <CardHeader className="space-y-4">
        <CardTitle className="text-lg">Estoque</CardTitle>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "add" ? "default" : "outline"}
            onClick={() => onModeChange("add")}
          >
            Somar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "subtract" ? "default" : "outline"}
            onClick={() => onModeChange("subtract")}
          >
            Subtrair
          </Button>
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "replace" ? "default" : "outline"}
            onClick={() => onModeChange("replace")}
          >
            Substituir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!productReady ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Crie o produto antes de configurar o estoque.
          </div>
        ) : !hasVariations ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Salve as combinações para gerar os itens.
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
            <div className="space-y-3">
              {savedItems.map((item) => {
                const rawValue = bulkValues[item.id] ?? "";
                const parsedValue = Number(rawValue);
                const previewStock =
                  rawValue === "" || Number.isNaN(parsedValue)
                    ? item.stock
                    : getNextStock(item.stock, parsedValue, bulkMode);

                return (
                  <div key={item.id} className="grid gap-3 rounded-2xl bg-card p-4 md:grid-cols-[1fr_160px_220px] md:items-end">
                    <div>
                      <p className="font-medium">{renderSavedItemLabel(item)}</p>
                      <p className="text-sm text-muted-foreground">Atual: {item.stock}</p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">Quantidade</p>
                      <Input
                        type="number"
                        min="0"
                        value={rawValue}
                        onChange={(event) => onValueChange(item.id, event.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                      Resultado previsto:{" "}
                      <span className="font-medium text-foreground">{previewStock}</span>
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