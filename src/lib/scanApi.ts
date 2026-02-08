import { supabase } from "@/integrations/supabase/client";

export type BackendScanResponse = {
  lat: number;
  lon: number;
  country: string;
  ip: string;
  score: number;
  status: "Safe" | "Suspicious" | "Dangerous";
};

export async function scanUrlWithBackend(url: string): Promise<BackendScanResponse> {
  const { data, error } = await supabase.functions.invoke<BackendScanResponse>("scan-url", {
    body: { url },
  });

  if (error) throw error;
  if (!data) throw new Error("Empty backend response");

  return data;
}
