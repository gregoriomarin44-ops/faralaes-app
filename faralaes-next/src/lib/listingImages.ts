const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PendingListingImage = {
  file: File;
  previewUrl: string;
};

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

export const validateListingImageFile = async (file: File) => {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`La imagen "${file.name}" supera el máximo de 2MB.`);
  }

  const mimeType = await sniffImageMimeType(file);

  if (!IMAGE_TYPES.includes(mimeType as (typeof IMAGE_TYPES)[number])) {
    throw new Error(`La imagen "${file.name}" no tiene un formato válido.`);
  }
};

export const uploadListingImage = async (file: File) => {
  await validateListingImageFile(file);

  const res = await fetch("/api/uploads/listing", {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "No se ha podido subir la imagen.");
  }

  const url = typeof data?.url === "string" ? data.url : "";

  if (!/^\/uploads\/listings\/[a-z0-9._-]+\.(jpe?g|png|webp)$/i.test(url)) {
    throw new Error("La URL de imagen devuelta no es válida.");
  }

  return url;
};
