import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, ImagePlus } from "lucide-react";
import { buildImageUrl } from "@/utils/image-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import type { ProductImage } from "@/types/product";

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
};

type SavedImageCropTarget = {
  id: string;
  url: string;
};

type ProductImageManagerProps = {
  images: ProductImage[];
  pendingImages: PendingImage[];
  isUploading: boolean;
  isDeletingImage: boolean;
  isUpdatingImage?: boolean;
  onPendingImagesChange: (files: File[]) => void;
  onRemovePendingImage: (id: string) => void;
  onDeleteImage: (imageId: string) => void;
  onReplaceImage?: (imageId: string, file: File) => Promise<void> | void;
};

function createImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function getCroppedFile(file: File, area: Area) {
  const imageUrl = URL.createObjectURL(file);
  const image = await createImageElement(imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;

  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Não foi possível preparar o crop da imagem");
  }

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), file.type || "image/jpeg", 0.92);
  });

  URL.revokeObjectURL(imageUrl);

  if (!blob) {
    throw new Error("Não foi possível finalizar o crop da imagem");
  }

  return new File([blob], file.name, { type: blob.type || file.type });
}

async function getCroppedFileFromUrl(imageUrl: string, area: Area, fileName: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a imagem para recorte");
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  return getCroppedFile(file, area);
}

export function ProductImageManager({
  images,
  pendingImages,
  isUploading,
  isDeletingImage,
  isUpdatingImage = false,
  onPendingImagesChange,
  onRemovePendingImage,
  onDeleteImage,
  onReplaceImage,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [savedCropTarget, setSavedCropTarget] = useState<SavedImageCropTarget | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const cropImageUrl = useMemo(
    () => (savedCropTarget ? buildImageUrl(savedCropTarget.url) : null),
    [savedCropTarget],
  );

  useEffect(() => {
    if (savedCropTarget) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [savedCropTarget]);

  const closeCropDialog = () => {
    setSavedCropTarget(null);
  };

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }

    const nextFiles = [...pendingImages.map((image) => image.file), ...files];
    onPendingImagesChange(nextFiles);
    event.target.value = "";
  };

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !savedCropTarget || !onReplaceImage) {
      return;
    }

    setIsCropping(true);

    try {
      const cropped = await getCroppedFileFromUrl(
        buildImageUrl(savedCropTarget.url),
        croppedAreaPixels,
        `cropped-${savedCropTarget.id}.jpg`,
      );
      await onReplaceImage(savedCropTarget.id, cropped);
      closeCropDialog();
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível recortar a imagem",
      });
    } finally {
      setIsCropping(false);
    }
  }, [croppedAreaPixels, onReplaceImage, savedCropTarget]);

  const showSavedGallery = images.length > 0;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Galeria do produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
        />

        {showSavedGallery ? (
          <div className="rounded-3xl border bg-background p-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-center transition-colors hover:bg-primary/10"
                disabled={isUploading}
              >
                <ImagePlus className="mb-2 h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-primary">Adicionar</span>
              </button>

              {images.map((image) => (
                <div key={image.id} className="group relative h-28 w-28 overflow-hidden rounded-2xl border bg-muted">
                  <img src={buildImageUrl(image.url)} alt="Imagem do produto" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    {onReplaceImage ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSavedCropTarget({ id: image.id, url: image.url })}
                        disabled={isUpdatingImage || isDeletingImage}
                      >
                        <Crop className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 rounded-md px-2 text-[11px]"
                      onClick={() => onDeleteImage(image.id)}
                      disabled={isDeletingImage || isUpdatingImage}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed bg-background p-8 text-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-10 text-center transition-colors hover:bg-primary/10"
              disabled={isUploading}
            >
              <ImagePlus className="mb-3 h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-primary">Clique para enviar imagens</span>
              <span className="mt-1 text-xs text-muted-foreground">As imagens novas são enviadas direto, sem crop.</span>
            </button>
          </div>
        )}

        {!showSavedGallery && pendingImages.length > 0 ? (
          <div className="space-y-3 rounded-3xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Enviando imagens...</p>
              <span className="text-xs text-muted-foreground">{pendingImages.length} arquivo(s)</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {pendingImages.map((image) => (
                <div key={image.id} className="group relative h-28 w-28 overflow-hidden rounded-2xl border bg-muted">
                  <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 rounded-md px-2 text-[11px]"
                      onClick={() => onRemovePendingImage(image.id)}
                      disabled={isUploading}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Dialog open={!!savedCropTarget} onOpenChange={(open) => !open && closeCropDialog()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Recortar imagem</DialogTitle>
            </DialogHeader>

            {cropImageUrl ? (
              <div className="space-y-4">
                <div className="relative h-[420px] overflow-hidden rounded-xl bg-black">
                  <Cropper
                    image={cropImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Zoom</p>
                  <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(value) => setZoom(value[0] ?? 1)} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeCropDialog} disabled={isCropping}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => void handleApplyCrop()} disabled={isCropping || isUpdatingImage}>
                    {isCropping || isUpdatingImage ? "Aplicando..." : "Aplicar crop"}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
