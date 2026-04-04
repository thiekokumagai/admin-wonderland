export function buildImageUrl(imagePath: string | null): string {
    if (!imagePath) return "";
  
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }
  
    return `${import.meta.env.VITE_MINIO_PUBLIC_URL}/${import.meta.env.VITE_MINIO_BUCKET}/${imagePath}`;
  }