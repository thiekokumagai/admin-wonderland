import { Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Variation } from "@/types/variation";

type ProductVariationSelectorProps = {
  variations: Variation[];
  selectedVariationIds: string[];
  onToggle: (variationId: string, checked: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
};

export function ProductVariationSelector({
  variations,
  selectedVariationIds,
  onToggle,
  onSave,
  isSaving,
  disabled,
}: ProductVariationSelectorProps) {
  return (
    <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Variações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variations.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma variação cadastrada ainda.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {variations.map((variation) => {
              const checked = selectedVariationIds.includes(variation.id);

              return (
                <label
                  key={variation.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onToggle(variation.id, !!value)}
                    disabled={disabled}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Layers3 className="h-4 w-4 text-primary" />
                      <span>{variation.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {variation.options.map((option) => option.value).join(", ") || "Sem opções"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={disabled || isSaving} className="rounded-xl">
            Salvar variações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
