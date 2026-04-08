import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductItem } from "@/types/product";

export type QuickEditMode = "add" | "subtract" | "replace";

type ProductStockEditorProps = {
  productReady: boolean;
  hasVariations: boolean;
  loadingSavedItems: boolean;
  savedItems: ProductItem[];
  quickEditItemId: string | null;
  quickEditMode: QuickEditMode;
  quickEditValue: string;
  isSaving: boolean;
  onStartEdit: (itemId: string) => void;
  onModeChange: (mode: QuickEditMode) => void;
  onValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (item: ProductItem) => void;
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
  quickEditItemId,
  quickEditMode,
  quickEditValue,
  isSaving,
  onStartEdit,
  onModeChange,
  onValueChange,
  onCancelEdit,
  onSaveEdit,
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
            Nenhum item gerado ainda. Salve as variações para criar os itens automaticamente.
          </div>
        ) : (
          <div className="space-y-3">
            {savedItems.map((item) => {
              const isEditing = quickEditItemId === item.id;
              const previewStock =
                quickEditValue === ""
                  ? item.stock
                  : getNextStock(item.stock, Number(quickEditValue || 0), quickEditMode);

              return (
                <div key={item.id} className="space-y-3 rounded-2xl bg-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{renderSavedItemLabel(item)}</p>
                      <p className="text-sm text-muted-foreground">Quantidade atual: {item.stock}</p>
                    </div>

                    {!isEditing ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => onStartEdit(item.id)}
                      >
                        Editar quantidade
                      </Button>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 rounded-2xl border border-dashed p-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={quickEditMode === "add" ? "default" : "outline"}
                          onClick={() => onModeChange("add")}
                        >
                          Somar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={quickEditMode === "subtract" ? "default" : "outline"}
                          onClick={() => onModeChange("subtract")}
                        >
                          Subtrair
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={quickEditMode === "replace" ? "default" : "outline"}
                          onClick={() => onModeChange("replace")}
                        >
                          Substituir
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            value={quickEditValue}
                            onChange={(event) => onValueChange(event.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                          Resultado previsto:{" "}
                          <span className="font-medium text-foreground">
                            {Number.isNaN(previewStock) ? item.stock : previewStock}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={onCancelEdit}>
                            Cancelar
                          </Button>
                          <Button type="button" onClick={() => onSaveEdit(item)} disabled={isSaving}>
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}