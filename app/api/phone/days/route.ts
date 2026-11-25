import { json, userClient } from "@/lib/phone/server";
export async function GET(request: Request) {
  try{
    const auth=await userClient(request);if(!auth)return json({error:"Iniciá sesión para consultar Pulso."},401);
    const since=new Date(Date.now()-93*86400000).toISOString().slice(0,10);
    const {data,error}=await auth.db.from("personal_phone_usage_daily").select("day,timezone,complete,observed_until,payload,device_id").eq("user_id",auth.user.id).gte("day",since).order("observed_until",{ascending:false});
    if(error)return json({error:"La conexión con Pulso todavía no está disponible en tu cuenta."},503);
    // Never add two devices together: each day uses the latest observed record.
    const seen=new Set<string>();const days=(data||[]).filter(row=>{if(seen.has(row.day))return false;seen.add(row.day);return true;});
    return json({days});
  }catch{return json({error:"No se pudo consultar Pulso."},503);}
}
