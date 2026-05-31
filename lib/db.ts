/**
 * Database-laag — legacy helpers, vervangen door lib/supabase.ts
 * Behouden voor backwards-compat; gebruik de helpers in lib/supabase.ts.
 */
export { getProfile, getVakman, getDiensten, getGesprekken, getBerichten, getVandaagBoekingen, getSpoedOproepen, formatPrijs } from "./supabase";
