import { createClient } from "@supabase/supabase-js";

const BUCKET = "listing-images";

type UploadListingImagesResult = {
  urls: string[];
  warning?: string;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se ha podido leer la imagen"));
    reader.readAsDataURL(file);
  });

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "Error desconocido";
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export async function uploadListingImages(
  files: File[]
): Promise<UploadListingImagesResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      urls: await Promise.all(files.map(fileToDataUrl)),
      warning:
        "Supabase Storage no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Se han usado imágenes base64 temporalmente.",
    };
  }

  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw new Error(
            `Supabase Storage (${BUCKET}): ${error.message}`
          );
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(data.path);

        if (!publicData.publicUrl) {
          throw new Error(
            `Supabase Storage (${BUCKET}): no se ha podido obtener la URL pública`
          );
        }

        return publicData.publicUrl;
      })
    );

    return { urls };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Error al subir imágenes a Supabase Storage:", error);

    return {
      urls: await Promise.all(files.map(fileToDataUrl)),
      warning: `${message}. Se han usado imágenes base64 temporalmente.`,
    };
  }
}
