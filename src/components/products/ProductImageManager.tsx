import { useCallback, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, ImagePlus, Trash2, Upload } from "lucide-react";
import { buildImageUrl } from "@/utils/image-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import type { ProductImage } from "@/types/product";

type PendingImage = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
};

type ProductImageManagerProps = {
  images: ProductImage[];
  pendingImages: PendingImage[];
  isUploading: boolean;
  isDeletingImage: boolean;
  canUpload: boolean;
  onPendingImagesChange: (files: File[]) => void;
  onRemovePendingImage: (id: string) => void;
  onUpload: () => void;
  onDeleteImage: (imageId: string) => void;
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

export function ProductImageManager({
  images,
  pendingImages,
  isUploading,
  isDeletingImage,
  canUpload,
  onPendingImagesChange,
  onRemovePendingImage,
  onUpload,
  onDeleteImage,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const currentCropImage = useMemo(
    () => (cropIndex !== null ? pendingImages[cropIndex] ?? null : null),
    [cropIndex, pendingImages],
  );

  const handleSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }

    onPendingImagesChange(files);
    event.target.value = "";
  };

  const handleApplyCrop = useCallback(async () => {
    if (cropIndex === null || !currentCropImage || !croppedAreaPixels) {
      return;
    }

    const cropped = await getCroppedFile(currentCropImage.file, croppedAreaPixels);
    const nextFiles = pendingImages.map((image, index) => (index === cropIndex ? cropped : image.file));
    onPendingImagesChange(nextFiles);
    setCropIndex(null);
    setZoom(1);
  }, [cropIndex, croppedAreaPixels, currentCropImage, onPendingImagesChange, pendingImages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Imagens do Produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Selecionar imagens
          </Button>
          {canUpload ? (
            <Button type="button" onClick={onUpload} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              Enviar imagens
            </Button>
          ) : null}
        </div>

        {pendingImages.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Imagens prontas para envio</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pendingImages.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-xl border">
                  <div className="aspect-square bg-muted">
                    <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="truncate text-xs text-muted-foreground">{image.name}</span>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setCropIndex(index)}>
                        <Crop className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => onRemovePendingImage(image.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-medium">Imagens salvas</p>
          {images.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma imagem enviada ainda.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-xl border">
                  <div className="aspect-square bg-muted">
                    <img src={buildImageUrl(image.url)} alt="Imagem do produto" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex justify-end p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteImage(image.id)}
                      disabled={isDeletingImage}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={cropIndex !== null} onOpenChange={(open) => !open && setCropIndex(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Recortar imagem</DialogTitle>
            </DialogHeader>

            {currentCropImage ? (
              <div className="space-y-4">
                <div className="relative h-[420px] overflow-hidden rounded-xl bg-black">
                  <Cropper
                    image={currentCropImage.previewUrl}
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
                  <Button type="button" variant="outline" onClick={() => setCropIndex(null)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => void handleApplyCrop()}>
                    Aplicar crop
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
