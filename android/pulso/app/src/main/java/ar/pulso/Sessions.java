package ar.pulso;
import java.util.*;

/** Best-effort foreground timeline, never counts overlapping apps twice. */
public final class Sessions {
 public static final class Event {
  public final long at; public final String app; public final int type;
  public Event(long at,String app,int type){this.at=at;this.app=app;this.type=type;}
 }
 public static final class Session {
  public final String app; public final long start; public long end;
  Session(String app,long start,long end){this.app=app;this.start=start;this.end=end;}
 }
 public static List<Session> calculate(List<Event> events,long from,long to){
  List<Session> out=new ArrayList<>(); String active=null; long start=from;
  for(Event e:events){
   if(e.at>to)break;
   if(e.type==1){
    if(e.app==null||e.app.equals(active))continue;
    add(out,active,Math.max(start,from),Math.min(e.at,to));active=e.app;start=e.at;
   }else if((e.type==2&&Objects.equals(e.app,active))||e.type==15||e.type==26){
    add(out,active,Math.max(start,from),Math.min(e.at,to));active=null;
   }
  }
  add(out,active,Math.max(start,from),to);return out;
 }
 private static void add(List<Session> out,String app,long start,long end){
  if(app==null||end<=start)return;
  // Coalesce short activity transitions in the same application.
  if(!out.isEmpty()) {Session last=out.get(out.size()-1);if(last.app.equals(app)&&last.end==start){last.end=end;return;}}
  out.add(new Session(app,start,end));
 }
}
