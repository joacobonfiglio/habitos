import { randomBytes, createHash } from "node:crypto";
import { json, userClient } from "@/lib/phone/server";
export const runtime="nodejs";
export async function POST(request: Request) {
  try {
    const auth=await userClient(request); if(!auth)return json({error:"Iniciá sesión para vincular tu teléfono."},401);
    const token=randomBytes(32).toString("base64url");
    const {data,error}=await auth.db.from("personal_phone_devices").insert({user_id:auth.user.id,name:"Mi teléfono",token_hash:createHash("sha256").update(token).digest("hex")}).select("id,name").single();
    if(error)return json({error:"La conexión con Pulso todavía no está disponible en tu cuenta."},503);
    return json({token,device:data});
  } catch { return json({error:"No se pudo conectar con tu cuenta. Volvé a intentar."},503); }
}
export async function GET(request: Request) {
  try {
    const auth=await userClient(request);if(!auth)return json({error:"Iniciá sesión para consultar tus dispositivos."},401);
    const {data,error}=await auth.db.from("personal_phone_devices").select("id,name,last_sync_at").eq("user_id",auth.user.id).is("revoked_at",null).order("created_at");
    return error?json({error:"La conexión con Pulso todavía no está disponible en tu cuenta."},503):json({devices:data});
  }catch{return json({error:"No se pudo conectar con tu cuenta."},503);}
}
export async function DELETE(request: Request) {
  try {
    const auth=await userClient(request);if(!auth)return json({error:"Iniciá sesión para desvincular el teléfono."},401);
    const id=new URL(request.url).searchParams.get("id");if(!id||!/^[0-9a-f-]{36}$/i.test(id))return json({error:"Dispositivo inválido."},400);
    const {error}=await auth.db.from("personal_phone_devices").update({revoked_at:new Date().toISOString()}).eq("user_id",auth.user.id).eq("id",id);
    return error?json({error:"No se pudo desvincular el teléfono."},503):json({ok:true});
  }catch{return json({error:"No se pudo conectar con tu cuenta."},503);}
}
