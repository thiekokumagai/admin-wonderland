import { CheckSquare, Plus, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Variation } from "@/types/variation";

type ProductVariationSelectorProps = {
  variations: Variation[];
  selectedVariationIds: string[];
  selectedOptionsByVariation: Record<string, string[]>;
  onChangeVariation: (slot: number, variationId: string) => void;
  onAddSlot: () => void;
  onToggleOption: (variationId: string, optionId: string, checked: boolean) => void;
  onToggleAllOptions: (variationId: string, checked: boolean) => void;
  disabled: boolean;
};

function getSelectedVariation(variations: Variation[], variationId?: string) {
  return variations.find((variation) => variation.id === variationId) ?? null;
}

export function ProductVariationSelector({
  variations,
  selectedVariationIds,
  selectedOptionsByVariation,
  onChangeVariation,
  onAddSlot,
  onToggleOption,
  onToggleAllOptions,
  disabled,
}: ProductVariationSelectorProps) {
  const slots = Math.max(selectedVariationIds.length, 1);

  return (
    <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-lg">Variações</CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione os tipos de variações disponíveis para o seu produto.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {variations.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma variação cadastrada ainda.
          </div>
        ) : (
          <>
            {Array.from({ length: slots }).map((_, index) => {
              const selectedVariationId = selectedVariationIds[index] ?? "";
              const selectedVariation = getSelectedVariation(variations, selectedVariationId);
              const selectedOptionIds = selectedVariation ? selectedOptionsByVariation[selectedVariation.id] ?? [] : [];
              const allChecked = !!selectedVariation && selectedVariation.options.length > 0 && selectedOptionIds.length === selectedVariation.options.length;

              return (
                <div key={`variation-slot-${index}`} className="space-y-4 rounded-3xl bg-background p-4">
                  <div className="space-y-2">
                    <Label>Variação {index + 1}</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={selectedVariationId}
                        onValueChange={(value) => onChangeVariation(index, value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 rounded-2xl bg-background">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {variations.map((variation) => {
                            const alreadySelected = selectedVariationIds.includes(variation.id) && selectedVariationId !== variation.id;
                            return (
                              <SelectItem key={variation.id} value={variation.id} disabled={alreadySelected}>
                                {variation.title}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {index === slots - 1 ? (
                        <Button
                          type="button"
                          className="h-12 rounded-2xl sm:w-12 sm:px-0"
                          variant="default"
                          onClick={onAddSlot}
                          disabled={disabled || selectedVariationIds.filter(Boolean).length >= variations.length}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {selectedVariation ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium text-foreground"
                        onClick={() => onToggleAllOptions(selectedVariation.id, !allChecked)}
                        disabled={disabled}
                      >
                        {allChecked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        Marcar todos
                      </button>

                      <div className="space-y-3">
                        {selectedVariation.options.map((option) => {
                          const checked = selectedOptionIds.includes(option.id);

                          return (
                            <label key={option.id} className="flex items-center gap-3 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => onToggleOption(selectedVariation.id, option.id, !!value)}
                                disabled={disabled}
                              />
                              <span>{option.value}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                      Selecione uma variação para listar as opções.
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
