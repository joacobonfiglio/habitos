package ar.pulso;
import android.service.notification.*;
import android.app.Notification;
import java.util.*;
public class Notifications extends NotificationListenerService {
 private final Set<String> active=new HashSet<>(); private NotificationStore store;
 public void onCreate(){super.onCreate();store=new NotificationStore(this);}
 public void onListenerConnected(){
  getSharedPreferences("pulso",0).edit().putLong("connected",System.currentTimeMillis()).apply();
  if(!getSharedPreferences("pulso",0).contains("since"))getSharedPreferences("pulso",0).edit().putLong("since",System.currentTimeMillis()).apply();
  active.clear();StatusBarNotification[] current=getActiveNotifications();if(current!=null)for(StatusBarNotification n:current)active.add(n.getKey());
 }
 public void onNotificationPosted(StatusBarNotification n){
  if(!active.add(n.getKey()))return;
  if(n.isOngoing()||(n.getNotification().flags&Notification.FLAG_GROUP_SUMMARY)!=0)return;
  store.add(n.getPackageName(),System.currentTimeMillis());
 }
 public void onNotificationRemoved(StatusBarNotification n){active.remove(n.getKey());}
 public void onDestroy(){store.close();super.onDestroy();}
}
