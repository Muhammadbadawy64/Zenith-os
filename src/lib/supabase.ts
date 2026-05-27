// Supabase Client Configuration for Brainhance OS
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://umlqugcupafrrtlngzra.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbHF1Z2N1cGFmcnJ0bG5nenJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY3NjQsImV4cCI6MjA5MzkyMjc2NH0.2Dc_8mok4vA7DMxYHSQXmnqNtvFuswh8l4hCShFPm2w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
