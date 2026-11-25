package ar.pulso;

import android.app.*;
import android.app.usage.*;
import android.content.*;
import android.content.pm.*;
import android.provider.Settings;
import org.json.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class UsageReader {
 public static boolean allowed(Context c){
  AppOpsManager m=(AppOpsManager)c.getSystemService(Context.APP_OPS_SERVICE);
  return m.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,android.os.Process.myUid(),c.getPackageName())==AppOpsManager.MODE_ALLOWED;
 }
 public static boolean notificationsAllowed(Context c){
  String s=Settings.Secure.getString(c.getContentResolver(),"enabled_notification_listeners");
  if(s!=null)for(String component:s.split(":")){ComponentName n=ComponentName.unflattenFromString(component);if(n!=null&&n.getPackageName().equals(c.getPackageName()))return true;}
  return false;
 }
 public static String label(Context c,String pkg){
  try{return c.getPackageManager().getApplicationLabel(c.getPackageManager().getApplicationInfo(pkg,0)).toString();}catch(Exception e){return pkg;}
 }
 public static JSONObject read(Context c,int period)throws Exception{return History.read(c,period,java.time.YearMonth.now().toString());}
 public static JSONObject range(Context c,long from,long to)throws Exception{
  long now=System.currentTimeMillis();ZoneId zone=ZoneId.systemDefault();LocalDate first=Instant.ofEpochMilli(from).atZone(zone).toLocalDate();
  LocalDate last=Instant.ofEpochMilli(Math.max(from,to-1)).atZone(zone).toLocalDate();
  JSONObject result=new JSONObject().put("allowed",allowed(c)).put("notificationsAllowed",notificationsAllowed(c)).put("from",from).put("to",to).put("period",0).put("updated",now);
  result.put("since",c.getSharedPreferences("pulso",0).getLong("since",0));
  List<Sessions.Event> events=new ArrayList<>();List<Sessions.Session> sessions=new ArrayList<>();
  if(allowed(c)){
   UsageStatsManager manager=(UsageStatsManager)c.getSystemService(Context.USAGE_STATS_SERVICE);
   UsageEvents raw=manager.queryEvents(from-86400000L,to);
   if(raw!=null){UsageEvents.Event e=new UsageEvents.Event();while(raw.hasNextEvent()){raw.getNextEvent(e);int type=e.getEventType();if(type==1||type==2||type==15||type==26)events.add(new Sessions.Event(e.getTimeStamp(),e.getPackageName(),type));}}
   sessions=Sessions.calculate(events,from,to);
  }
  String launcher="";Intent home=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);ResolveInfo ri=c.getPackageManager().resolveActivity(home,PackageManager.MATCH_DEFAULT_ONLY);if(ri!=null)launcher=ri.activityInfo.packageName;
  JSONObject notif;try(NotificationStore store=new NotificationStore(c)){notif=store.summary(from,to);result.put("notificationHours",store.hours(from,to));}
  Map<String,JSONObject> apps=new HashMap<>();long[] hourly=new long[24];int[] opens=new int[24];JSONArray timeline=new JSONArray();long total=0;int count=0;long longest=0;
  TreeMap<String,Long> days=new TreeMap<>();for(LocalDate d=first;!d.isAfter(last);d=d.plusDays(1))days.put(d.toString(),0L);
  for(Sessions.Session s:sessions){
   if(s.app.equals(launcher)||s.app.equals("com.android.systemui"))continue;
   long duration=s.end-s.start;if(duration<=0)continue;
   JSONObject app=apps.get(s.app);if(app==null){app=base(c,s.app);apps.put(s.app,app);}
   app.put("ms",app.getLong("ms")+duration).put("sessions",app.getInt("sessions")+1).put("longest",Math.max(app.getLong("longest"),duration));
   total+=duration;count++;longest=Math.max(longest,duration);
   int h=Instant.ofEpochMilli(s.start).atZone(zone).getHour();opens[h]++;
   JSONArray ah=app.getJSONArray("hours");long cursor=s.start;
   while(cursor<s.end){ZonedDateTime z=Instant.ofEpochMilli(cursor).atZone(zone);long next=Math.min(s.end,z.truncatedTo(ChronoUnit.HOURS).plusHours(1).toInstant().toEpochMilli());long span=next-cursor;int hour=z.getHour();hourly[hour]+=span;ah.put(hour,ah.getLong(hour)+span);String date=z.toLocalDate().toString();days.put(date,days.getOrDefault(date,0L)+span);cursor=next;}
   timeline.put(new JSONObject().put("app",s.app).put("name",app.getString("name")).put("start",s.start).put("end",s.end));
  }
  int notificationTotal=0;Iterator<String> keys=notif.keys();while(keys.hasNext()){String pkg=keys.next();int n=notif.getInt(pkg);notificationTotal+=n;JSONObject a=apps.get(pkg);if(a==null){a=base(c,pkg);apps.put(pkg,a);}a.put("notifications",n);}
  List<JSONObject> ordered=new ArrayList<>(apps.values());ordered.sort((a,b)->Long.compare(b.optLong("ms"),a.optLong("ms")));
  JSONArray list=new JSONArray();for(JSONObject a:ordered)list.put(a);
  JSONArray hours=new JSONArray(),opening=new JSONArray(),daily=new JSONArray();for(int i=0;i<24;i++){hours.put(hourly[i]);opening.put(opens[i]);}for(Map.Entry<String,Long> d:days.entrySet())daily.put(new JSONObject().put("date",d.getKey()).put("ms",d.getValue()));
  // Recent timeline is capped; aggregates above always use the complete query.
  JSONArray recent=new JSONArray();for(int i=timeline.length()-1;i>=Math.max(0,timeline.length()-200);i--)recent.put(timeline.get(i));
  return result.put("apps",list).put("hours",hours).put("opens",opening).put("days",daily).put("timeline",recent).put("total",total).put("sessions",count).put("longest",longest).put("notifications",notificationTotal);
 }
 private static JSONObject base(Context c,String pkg)throws JSONException{JSONArray h=new JSONArray();for(int i=0;i<24;i++)h.put(0);return new JSONObject().put("id",pkg).put("name",label(c,pkg)).put("ms",0).put("sessions",0).put("longest",0).put("notifications",0).put("hours",h);}
 public static String time(long ms){long mins=ms/60000;return mins>=60?(mins/60)+" h "+(mins%60)+" min":mins+" min";}
}
