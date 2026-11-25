package ar.pulso;
import android.content.*;
import android.database.*;
import android.database.sqlite.*;
import android.app.usage.*;
import org.json.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class History extends SQLiteOpenHelper {
 public History(Context c){super(c,"history.db",null,1);}
 public void onCreate(SQLiteDatabase db){db.execSQL("CREATE TABLE days (day TEXT PRIMARY KEY, complete INTEGER NOT NULL, payload TEXT NOT NULL)");}
 public void onUpgrade(SQLiteDatabase db,int old,int next){}
 static long at(LocalDate d){return d.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();}
 public static synchronized void sync(Context c)throws Exception{
  if(!UsageReader.allowed(c))return;
  long now=System.currentTimeMillis();android.content.SharedPreferences pref=c.getSharedPreferences("pulso",0);
  // Capture live data on every explicit refresh; finished days at most every 15 minutes.
  long last=pref.getLong("history_sync",0);boolean backfill=now-last>15*60000L||now<last;
  LocalDate today=LocalDate.now();
  UsageEvents probe=((UsageStatsManager)c.getSystemService(Context.USAGE_STATS_SERVICE)).queryEvents(at(today.minusDays(8)),now);
  if(probe==null)return;
  UsageEvents.Event e=new UsageEvents.Event();long earliest=Long.MAX_VALUE;
  while(probe.hasNextEvent()){probe.getNextEvent(e);int t=e.getEventType();if(t==1||t==2||t==15||t==26)earliest=Math.min(earliest,e.getTimeStamp());}
  if(earliest==Long.MAX_VALUE)return; // No evidence is not evidence of zero use.
  LocalDate first=Instant.ofEpochMilli(earliest).atZone(ZoneId.systemDefault()).toLocalDate();
  try(History store=new History(c)){
   for(LocalDate d=backfill?first:today;!d.isAfter(today);d=d.plusDays(1)){
    boolean complete=d.isAfter(first)&&d.isBefore(today);
    JSONObject snapshot=UsageReader.range(c,at(d),Math.min(at(d.plusDays(1)),now));
    store.save(d,snapshot.put("timezone",ZoneId.systemDefault().getId()),complete);
   }
   store.getWritableDatabase().delete("days","day < ?",new String[]{today.minusMonths(24).toString()});
  }
  if(backfill)pref.edit().putLong("history_sync",now).apply();
 }
 void save(LocalDate day,JSONObject data,boolean complete){
  SQLiteDatabase db=getWritableDatabase();db.beginTransaction();try{
   try(Cursor cur=db.rawQuery("SELECT complete,payload FROM days WHERE day=?",new String[]{day.toString()})){
    if(cur.moveToFirst()){
     if(cur.getInt(0)==1&&!complete)return;
     if(!complete){try{if(new JSONObject(cur.getString(1)).optLong("to")>data.optLong("to"))return;}catch(JSONException ignored){}}
    }
   }
   ContentValues values=new ContentValues();values.put("day",day.toString());values.put("complete",complete?1:0);values.put("payload",data.toString());db.insertWithOnConflict("days",null,values,SQLiteDatabase.CONFLICT_REPLACE);db.setTransactionSuccessful();
  }finally{db.endTransaction();}
 }
 public static JSONObject read(Context c,int type,String month)throws Exception{
  sync(c);LocalDate today=LocalDate.now();YearMonth selected;
  try{selected=YearMonth.parse(month);}catch(Exception e){selected=YearMonth.from(today);}
  if(selected.isBefore(YearMonth.from(today).minusMonths(23)))selected=YearMonth.from(today).minusMonths(23);
  if(selected.isAfter(YearMonth.from(today)))selected=YearMonth.from(today);
  Periods p=new Periods(type,selected,today);JSONObject out;
  try(History store=new History(c)){
   out=store.aggregate(c,p.from,p.until);
   JSONObject current=store.aggregate(c,p.compareFrom,p.compareUntil),previous=store.aggregate(c,p.baselineFrom,p.baselineUntil);
   boolean comparable=UsageReader.allowed(c)&&p.comparedDays()>0&&current.getInt("completeDays")==p.comparedDays()&&previous.getInt("completeDays")==p.comparedDays();
   JSONObject cmp=new JSONObject().put("available",comparable).put("days",p.comparedDays()).put("from",p.compareFrom).put("until",p.compareUntil).put("previousFrom",p.baselineFrom).put("previousUntil",p.baselineUntil).put("current",current.getLong("total")).put("previous",previous.getLong("total")).put("currentDays",current.getInt("completeDays")).put("previousDays",previous.getInt("completeDays"));
   Double change=Periods.change(current.getLong("total"),previous.getLong("total"));cmp.put("percent",comparable&&change!=null?change:JSONObject.NULL);
   out.put("comparison",cmp);
   Map<String,JSONObject> currentApps=index(current.getJSONArray("apps")),previousApps=index(previous.getJSONArray("apps")),display=index(out.getJSONArray("apps"));
   for(String id:previousApps.keySet())if(comparable&&!display.containsKey(id)){JSONObject a=new JSONObject(previousApps.get(id).toString());a.put("ms",0).put("sessions",0).put("notifications",0).put("longest",0).put("hours",zeros());display.put(id,a);}
   for(JSONObject a:display.values()){
    long v=currentApps.containsKey(a.getString("id"))?currentApps.get(a.getString("id")).getLong("ms"):0;
    long b=previousApps.containsKey(a.getString("id"))?previousApps.get(a.getString("id")).getLong("ms"):0;
    Double delta=Periods.change(v,b);a.put("comparisonCurrent",v).put("previous",b).put("change",comparable&&delta!=null?delta:JSONObject.NULL);
   }
   out.put("apps",sorted(display));
  }
  return out.put("period",type).put("month",selected.toString()).put("monthMax",YearMonth.from(today).toString()).put("monthMin",YearMonth.from(today).minusMonths(23).toString());
 }
 static JSONArray zeros()throws JSONException{JSONArray a=new JSONArray();for(int i=0;i<24;i++)a.put(0);return a;}
 static Map<String,JSONObject> index(JSONArray list)throws JSONException{Map<String,JSONObject> m=new HashMap<>();for(int i=0;i<list.length();i++){JSONObject a=list.getJSONObject(i);m.put(a.getString("id"),a);}return m;}
 static JSONArray sorted(Map<String,JSONObject> map){List<JSONObject> values=new ArrayList<>(map.values());values.sort((a,b)->Long.compare(b.optLong("ms"),a.optLong("ms")));return new JSONArray(values);}
 JSONObject aggregate(Context c,LocalDate from,LocalDate until)throws Exception{
  JSONObject out=new JSONObject().put("allowed",UsageReader.allowed(c)).put("notificationsAllowed",UsageReader.notificationsAllowed(c)).put("since",c.getSharedPreferences("pulso",0).getLong("since",0)).put("updated",System.currentTimeMillis()).put("from",at(from)).put("to",Math.min(at(until),System.currentTimeMillis()));
  Map<String,JSONObject> apps=new HashMap<>();Map<String,JSONObject> snapshots=new HashMap<>();Set<String> complete=new HashSet<>();JSONArray days=new JSONArray(),timeline=new JSONArray(),hours=zeros(),opens=zeros();long total=0,longest=0;int sessions=0;
  try(Cursor cur=getReadableDatabase().rawQuery("SELECT day,complete,payload FROM days WHERE day>=? AND day<? ORDER BY day",new String[]{from.toString(),until.toString()})){
   while(cur.moveToNext()){snapshots.put(cur.getString(0),new JSONObject(cur.getString(2)));if(cur.getInt(1)==1)complete.add(cur.getString(0));}
  }
  for(LocalDate d=from;d.isBefore(until);d=d.plusDays(1)){
   JSONObject s=snapshots.get(d.toString());days.put(new JSONObject().put("date",d.toString()).put("ms",s==null?JSONObject.NULL:s.getLong("total")).put("complete",complete.contains(d.toString())));
   if(s==null)continue;
   total+=s.getLong("total");sessions+=s.getInt("sessions");longest=Math.max(longest,s.getLong("longest"));
   for(int h=0;h<24;h++){hours.put(h,hours.getLong(h)+s.getJSONArray("hours").getLong(h));opens.put(h,opens.getInt(h)+s.getJSONArray("opens").getInt(h));}
   JSONArray list=s.getJSONArray("apps");for(int i=0;i<list.length();i++){
    JSONObject a=list.getJSONObject(i),target=apps.get(a.getString("id"));
    if(target==null){target=new JSONObject(a.toString());target.put("notifications",0);apps.put(a.getString("id"),target);}
    else{target.put("ms",target.getLong("ms")+a.getLong("ms")).put("sessions",target.getInt("sessions")+a.getInt("sessions")).put("longest",Math.max(target.getLong("longest"),a.getLong("longest")));for(int h=0;h<24;h++)target.getJSONArray("hours").put(h,target.getJSONArray("hours").getLong(h)+a.getJSONArray("hours").getLong(h));}
   }
   JSONArray t=s.getJSONArray("timeline");for(int i=0;i<t.length();i++)timeline.put(t.get(i));
  }
  List<JSONObject> all=new ArrayList<>();for(int i=0;i<timeline.length();i++)all.add(timeline.getJSONObject(i));all.sort((a,b)->Long.compare(b.optLong("start"),a.optLong("start")));JSONArray recent=new JSONArray();for(int i=0;i<Math.min(200,all.size());i++)recent.put(all.get(i));
  int notifications=0;try(NotificationStore n=new NotificationStore(c)){
   JSONObject byApp=n.summary(at(from),Math.min(at(until),System.currentTimeMillis()));out.put("notificationHours",n.hours(at(from),Math.min(at(until),System.currentTimeMillis())));
   Iterator<String> keys=byApp.keys();while(keys.hasNext()){String id=keys.next();int count=byApp.getInt(id);notifications+=count;JSONObject a=apps.get(id);if(a==null){a=new JSONObject().put("id",id).put("name",UsageReader.label(c,id)).put("ms",0).put("sessions",0).put("longest",0).put("hours",zeros());apps.put(id,a);}a.put("notifications",count);}
  }
  return out.put("apps",sorted(apps)).put("total",total).put("sessions",sessions).put("longest",longest).put("notifications",notifications).put("hours",hours).put("opens",opens).put("days",days).put("timeline",recent).put("recordedDays",snapshots.size()).put("completeDays",complete.size()).put("expectedDays",ChronoUnit.DAYS.between(from,until));
 }
}
