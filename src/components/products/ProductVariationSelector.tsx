import { CheckCircle2, CheckSquare, Plus, Square, Trash2, Unlink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  onRemoveSlot: (slot: number) => void;
  onToggleOption: (variationId: string, optionId: string, checked: boolean) => void;
  onToggleAllOptions: (variationId: string, checked: boolean) => void;
  onRemoveVariation: (variationId: string) => void;
  onRemoveVariationOption: (variationId: string, optionId: string) => void;
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
  onRemoveSlot,
  onToggleOption,
  onToggleAllOptions,
  onRemoveVariation,
  onRemoveVariationOption,
  disabled,
}: ProductVariationSelectorProps) {
  const slots = Math.max(selectedVariationIds.length, 1);

  return (
    <div className="space-y-6">
      {variations.length === 0 ? (
        <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma variação cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <>
          {Array.from({ length: slots }).map((_, index) => {
            const selectedVariationId = selectedVariationIds[index] ?? "";
            const selectedVariation = getSelectedVariation(variations, selectedVariationId);
            const selectedOptionIds = selectedVariation ? selectedOptionsByVariation[selectedVariation.id] ?? [] : [];
            const allChecked = !!selectedVariation && selectedVariation.options.length > 0 && selectedOptionIds.length === selectedVariation.options.length;
            const canRemove = slots > 1;

            return (
              <div key={`variation-slot-${index}`} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base font-semibold">Variação {index + 1}</Label>
                  <div className="flex items-center gap-2">
                    {selectedVariation ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveVariation(selectedVariation.id)}
                        disabled={disabled}
                        className="text-destructive"
                        title="Remover variação do produto"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    ) : null}

                    {canRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveSlot(index)}
                        disabled={disabled}
                        className="text-destructive"
                        title="Remover linha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>

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

                {selectedVariation ? (
                  <div className="space-y-4 pt-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-medium text-foreground"
                      onClick={() => onToggleAllOptions(selectedVariation.id, !allChecked)}
                      disabled={disabled}
                    >
                      {allChecked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      Marcar todos
                    </button>

                    <div className="space-y-4">
                      {selectedVariation.options.map((option) => {
                        const checked = selectedOptionIds.includes(option.id);

                        return (
                          <div key={option.id} className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              className="flex items-center gap-3 text-left"
                              onClick={() => onToggleOption(selectedVariation.id, option.id, !checked)}
                              disabled={disabled}
                            >
                              {checked ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border border-muted-foreground/40" />
                              )}
                              <span className="text-base">{option.value}</span>
                            </button>

                            {checked ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => onRemoveVariationOption(selectedVariation.id, option.id)}
                                disabled={disabled}
                                title="Remover opção cadastrada"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}