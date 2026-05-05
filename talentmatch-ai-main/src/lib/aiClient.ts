import { supabase } from "@/integrations/supabase/client";

export async function callFn<T = any>(name: string, body: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}
