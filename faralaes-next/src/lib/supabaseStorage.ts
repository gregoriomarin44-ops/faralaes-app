import { createClient } from "@supabase/supabase-js";

const BUCKET = "listing-images";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anonKey);
}

export async function uploadListingImages(files: File[]) {
  const supabase = getSupabaseClient();

  return Promise.all(
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
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    })
  );
}
