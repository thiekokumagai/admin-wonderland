import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, ImageIcon, Plus, X } from "lucide-react";
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

const MAX_IMAGES = 9;

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

  const totalImages = images.length + pendingImages.length;
  const remainingSlots = Math.max(0, MAX_IMAGES - totalImages);

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

    const acceptedFiles = files.slice(0, remainingSlots);

    if (acceptedFiles.length < files.length) {
      toast({ title: `Você pode adicionar no máximo ${MAX_IMAGES} fotos.` });
    }

    if (acceptedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = [...pendingImages.map((image) => image.file), ...acceptedFiles];
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

  const slots = Array.from({ length: MAX_IMAGES }, (_, index) => {
    const savedImage = images[index];
    if (savedImage) {
      return { type: "saved" as const, key: `saved-${savedImage.id}`, image: savedImage, index };
    }

    const pendingImage = pendingImages[index - images.length];
    if (pendingImage) {
      return { type: "pending" as const, key: `pending-${pendingImage.id}`, image: pendingImage, index };
    }

    return { type: "empty" as const, key: `empty-${index}`, index };
  });

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">Fotos do produto</CardTitle>
        <Button type="button" variant="outline" className="rounded-xl" disabled={images.length === 0 && pendingImages.length === 0}>
          Editar imagem
        </Button>
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {slots.map((slot) => {
            if (slot.type === "saved") {
              return (
                <div key={slot.key} className="relative overflow-hidden rounded-2xl bg-muted aspect-square">
                  <img src={buildImageUrl(slot.image.url)} alt={`Imagem ${slot.index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onDeleteImage(slot.image.id)}
                    disabled={isDeletingImage || isUpdatingImage}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {onReplaceImage ? (
                    <button
                      type="button"
                      onClick={() => setSavedCropTarget({ id: slot.image.id, url: slot.image.url })}
                      disabled={isUpdatingImage || isDeletingImage}
                      className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Crop className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              );
            }

            if (slot.type === "pending") {
              return (
                <div key={slot.key} className="relative overflow-hidden rounded-2xl bg-muted aspect-square">
                  <img src={slot.image.previewUrl} alt={slot.image.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemovePendingImage(slot.image.id)}
                    disabled={isUploading}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={remainingSlots === 0 || isUploading}
                className="relative flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImageIcon className="h-14 w-14" />
                {remainingSlots > 0 ? (
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Plus className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">Máximo de {MAX_IMAGES} fotos por produto.</p>

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