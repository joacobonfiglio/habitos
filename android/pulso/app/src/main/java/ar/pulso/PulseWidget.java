package ar.pulso;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.widget.RemoteViews;
import org.json.*;
public class PulseWidget extends AppWidgetProvider {
 @Override public void onReceive(Context c,Intent intent){
  super.onReceive(c,intent);
  if("ar.pulso.REFRESH".equals(intent.getAction()))refresh(c,goAsync());
 }
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){refresh(c,goAsync());}
 private static void refresh(Context c,BroadcastReceiver.PendingResult pending){new Thread(()->{try{updateAll(c,UsageReader.read(c,0));}catch(Exception e){try{updateAll(c,new JSONObject().put("allowed",false));}catch(Exception ignored){}}finally{pending.finish();}},"pulso-widget").start();}
 public static void updateAll(Context c,JSONObject data){
  AppWidgetManager m=AppWidgetManager.getInstance(c);int[] ids=m.getAppWidgetIds(new ComponentName(c,PulseWidget.class));
  for(int id:ids){RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget);boolean ok=data.optBoolean("allowed");v.setTextViewText(R.id.widget_time,ok?(data.optInt("recordedDays")>0?UsageReader.time(data.optLong("total")):"Sin datos aún"):"Activá el acceso");
   String at=android.text.format.DateFormat.format("HH:mm",System.currentTimeMillis()).toString();v.setTextViewText(R.id.widget_detail,ok?data.optInt("sessions")+" sesiones estimadas · "+at:"Tocá para abrir Pulso");
   v.setOnClickPendingIntent(R.id.widget_root,PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
   v.setOnClickPendingIntent(R.id.widget_refresh,PendingIntent.getBroadcast(c,1,new Intent(c,PulseWidget.class).setAction("ar.pulso.REFRESH"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));m.updateAppWidget(id,v);
  }
 }
}
