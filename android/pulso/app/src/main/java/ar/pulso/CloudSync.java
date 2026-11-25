package ar.pulso;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.security.KeyStore;
import java.time.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Sends only daily application statistics. It cannot read LifeOS or modify its snapshot. */
public final class CloudSync {
 private static final String ENDPOINT="https://habitos-khaki.vercel.app/api/phone/sync";
 private static final String ALIAS="pulso-cloud-token";
 private static SharedPreferences prefs(Context c){return c.getSharedPreferences("pulso_cloud",0);}
 private static javax.crypto.SecretKey key()throws Exception{
  KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
  if(store.containsAlias(ALIAS))return (javax.crypto.SecretKey)store.getKey(ALIAS,null);
  KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
  gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
  return gen.generateKey();
 }
 private static String token(Context c)throws Exception{
  String packed=prefs(c).getString("token",null);if(packed==null)return null;
  String[] parts=packed.split(":");if(parts.length!=2)throw new Exception("Código inválido");
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
  return new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
 }
 public static boolean linked(Context c){return prefs(c).contains("token");}
 public static synchronized void connect(Context c,String raw)throws Exception{
  String value=raw.trim();if(!value.matches("[A-Za-z0-9_-]{43}"))throw new Exception("Copiá el código completo desde LifeOS.");
  // Verify the new code before replacing a working connection.
  History.sync(c);JSONArray days=exportDays(c,true);if(days.length()==0)throw new Exception("Activá el acceso de uso y abrí Pulso antes de vincular.");
  send(value,days);
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
  String packed=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
  prefs(c).edit().putString("token",packed).putLong("last",System.currentTimeMillis()).remove("error").putBoolean("backfill",true).commit();
 }
 public static synchronized void disconnect(Context c){prefs(c).edit().clear().commit();}
 public static JSONObject status(Context c)throws JSONException{return new JSONObject().put("linked",linked(c)).put("last",prefs(c).getLong("last",0)).put("error",prefs(c).getString("error",""));}
 public static synchronized void sync(Context c,boolean force)throws Exception{
  if(!linked(c))return;
  long last=prefs(c).getLong("last",0);if(!force&&!prefs(c).getBoolean("backfill",false)&&System.currentTimeMillis()-last<15*60000L)return;
  try{
   if(!UsageReader.allowed(c))throw new Exception("Activá el acceso de uso para sincronizar.");
   History.sync(c);String value=token(c);
   JSONArray days=exportDays(c,!prefs(c).getBoolean("backfill",false));
   for(int offset=0;offset<days.length();offset+=31){JSONArray batch=new JSONArray();for(int i=offset;i<Math.min(offset+31,days.length());i++)batch.put(days.get(i));send(value,batch);}
   if(days.length()==0)throw new Exception("Todavía no hay estadísticas disponibles.");
   prefs(c).edit().putLong("last",System.currentTimeMillis()).putBoolean("backfill",false).remove("error").commit();
  }catch(Exception e){prefs(c).edit().putString("error",e.getMessage()==null?"Sin conexión. Tus datos siguen en este teléfono.":e.getMessage()).commit();throw e;}
 }
 private static JSONArray exportDays(Context c,boolean recent)throws Exception{
  JSONArray days=new JSONArray();String since=LocalDate.now().minusDays(recent?30:732).toString();
  try(History h=new History(c);Cursor cur=h.getReadableDatabase().rawQuery("SELECT day,complete,payload FROM days WHERE day>=? ORDER BY day",new String[]{since})){
   while(cur.moveToNext()){
    JSONObject snapshot=new JSONObject(cur.getString(2));JSONArray apps=new JSONArray(),raw=snapshot.getJSONArray("apps");
    for(int i=0;i<raw.length();i++){JSONObject a=raw.getJSONObject(i);apps.put(new JSONObject().put("id",a.getString("id")).put("name",a.getString("name")).put("ms",a.getLong("ms")));}
    boolean notificationsComplete=snapshot.optBoolean("notificationsAllowed")&&snapshot.optLong("since")>0&&snapshot.optLong("from")>=snapshot.optLong("since");
    JSONObject payload=new JSONObject().put("total",snapshot.getLong("total")).put("sessions",snapshot.getInt("sessions")).put("notifications",notificationsComplete?snapshot.optInt("notifications"):JSONObject.NULL).put("hours",snapshot.getJSONArray("hours")).put("apps",apps);
    days.put(new JSONObject().put("day",cur.getString(0)).put("timezone",snapshot.optString("timezone",ZoneId.systemDefault().getId())).put("complete",cur.getInt(1)==1).put("observed_until",Instant.ofEpochMilli(snapshot.getLong("to")).toString()).put("payload",payload));
   }
  }
  return days;
 }
 private static void send(String token,JSONArray days)throws Exception{
  HttpURLConnection connection=(HttpURLConnection)new URL(ENDPOINT).openConnection();
  try{
   connection.setConnectTimeout(12000);connection.setReadTimeout(15000);connection.setInstanceFollowRedirects(false);connection.setRequestMethod("POST");connection.setDoOutput(true);
   connection.setRequestProperty("Authorization","Bearer "+token);connection.setRequestProperty("Content-Type","application/json");
   byte[] bytes=new JSONObject().put("days",days).toString().getBytes(StandardCharsets.UTF_8);connection.setFixedLengthStreamingMode(bytes.length);
   try(OutputStream output=connection.getOutputStream()){output.write(bytes);}
   int code=connection.getResponseCode();
   if(code==401)throw new Exception("Código vencido o teléfono desvinculado. Generá uno nuevo en LifeOS.");
   if(code<200||code>=300)throw new Exception("LifeOS no pudo recibir los datos. Reintentá más tarde.");
   try(InputStream input=connection.getInputStream()){byte[] buffer=new byte[1024];while(input.read(buffer)!=-1){}}
  }catch(java.io.IOException e){throw new Exception("Sin conexión. Tus datos siguen en este teléfono.");}
  finally{connection.disconnect();}
 }
}
