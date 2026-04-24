import { createClient } from "@supabase/supabase-js";
import { makeCompanyId } from "@/utils/ids";
import { type MartechCompany } from "@/types/martech";

// Client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

export async function fetchEnterprisesByDepartment(dept: string, page: number, perPage: number) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Requête directe vers votre base Supabase
  const { data, count, error } = await supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("department", dept)
    .range(from, to);

  if (error) throw error;

  return {
    items: data || [],
    meta: {
      totalResults: count || 0,
      page: page,
      perPage: perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    },
  };
}