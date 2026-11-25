import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const noStore = { "Cache-Control": "no-store" };
export function json(data: unknown, status=200) { return NextResponse.json(data,{status,headers:noStore}); }
export function phoneClient(token?: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://gohbsqarzjdwunkcrjew.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_hZqC9Yw93ZtrI-Z7s7W2gA_L7n8Zvf3",{
    auth:{persistSession:false,autoRefreshToken:false},
    global:token?{headers:{Authorization:`Bearer ${token}`}}:undefined,
  });
}
export async function userClient(request: Request) {
  const token=request.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token) return null;
  const db=phoneClient(token);
  const {data,error}=await db.auth.getUser(token);
  return error||!data.user?null:{db,user:data.user};
}
