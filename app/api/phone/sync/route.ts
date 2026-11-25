import { json, phoneClient } from "@/lib/phone/server";
import { normalizeDays } from "@/lib/phone/usage";
export const runtime="nodejs";
export async function POST(request: Request) {
  const token=request.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return json({error:"Código de vinculación inválido."},401);
  let raw:unknown;
  try {
    const reader=request.body?.getReader();if(!reader)return json({error:"Faltan datos."},400);
    const chunks:Uint8Array[]=[];let length=0;
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>1000000){await reader.cancel();return json({error:"El envío es demasiado grande."},413);}chunks.push(value);}
    const data=new Uint8Array(length);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.length;}
    raw=JSON.parse(new TextDecoder().decode(data));
  }catch{return json({error:"Formato inválido."},400);}
  let days;
  try{days=normalizeDays(raw);}catch(e){return json({error:e instanceof Error?e.message:"Datos inválidos."},400);}
  try{
    const {data,error}=await phoneClient().rpc("personal_ingest_phone_usage",{p_token:token,p_days:days});
    if(error)return json({error:"No se pudo sincronizar. Revisá la conexión y el código de vinculación."},error.code==="28000"?401:503);
    return json({ok:true,result:data});
  }catch{return json({error:"La sincronización no está disponible. Tus datos siguen en el teléfono."},503);}
}
