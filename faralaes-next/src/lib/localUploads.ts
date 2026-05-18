const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MAX_SIZE = 512;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const sniffImageMimeType = async (file: File) => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const header = String.fromCharCode(...bytes);

  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  return "";
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se ha podido procesar la imagen"));
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se ha podido redimensionar la imagen"));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("No se ha podido leer la imagen"));
    };
    reader.onerror = () => reject(new Error("No se ha podido leer la imagen"));
    reader.readAsDataURL(blob);
  });

const resizeAvatarFile = async (file: File) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const ratio = Math.min(
      1,
      AVATAR_MAX_SIZE / image.naturalWidth,
      AVATAR_MAX_SIZE / image.naturalHeight
    );
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("No se ha podido preparar la imagen");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvasToBlob(canvas, "image/webp", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export async function uploadAvatarImage(file: File) {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("La imagen debe pesar 2MB como máximo.");
  }

  const mimeType = await sniffImageMimeType(file);

  if (!AVATAR_TYPES.includes(mimeType as (typeof AVATAR_TYPES)[number])) {
    throw new Error("Solo puedes subir imágenes JPG, PNG o WEBP.");
  }

  const resizedBlob = await resizeAvatarFile(file);

  if (resizedBlob.size > AVATAR_MAX_BYTES) {
    throw new Error("La imagen redimensionada supera el máximo de 2MB.");
  }

  const image = await blobToDataUrl(resizedBlob);
  const res = await fetch("/api/uploads/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "No se ha podido subir la imagen.");
  }

  return { url: data.url as string };
}
