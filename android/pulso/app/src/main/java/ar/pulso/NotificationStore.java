package ar.pulso;
import android.content.*;
import android.database.*;
import android.database.sqlite.*;
import org.json.*;
public class NotificationStore extends SQLiteOpenHelper {
 public NotificationStore(Context c){super(c,"notifications.db",null,1);}
 public void onCreate(SQLiteDatabase db){db.execSQL("CREATE TABLE counts (at INTEGER NOT NULL, app TEXT NOT NULL)");db.execSQL("CREATE INDEX counts_at ON counts(at)");}
 public void onUpgrade(SQLiteDatabase d,int o,int n){}
 public void add(String app,long at){SQLiteDatabase db=getWritableDatabase();ContentValues v=new ContentValues();v.put("at",at);v.put("app",app);db.insert("counts",null,v);db.delete("counts","at < ?",new String[]{String.valueOf(at-90L*86400000)});}
 public JSONObject summary(long from,long to)throws JSONException{
  getWritableDatabase().delete("counts","at < ?",new String[]{String.valueOf(System.currentTimeMillis()-90L*86400000)});
  JSONObject out=new JSONObject();try(Cursor c=getReadableDatabase().rawQuery("SELECT app, COUNT(*) FROM counts WHERE at>=? AND at<? GROUP BY app",new String[]{""+from,""+to})){while(c.moveToNext())out.put(c.getString(0),c.getInt(1));}return out;
 }
 public void clear(){getWritableDatabase().delete("counts",null,null);}
 public JSONArray hours(long from,long to)throws JSONException{
  int[] counts=new int[24];java.time.ZoneId zone=java.time.ZoneId.systemDefault();
  try(Cursor c=getReadableDatabase().rawQuery("SELECT at FROM counts WHERE at>=? AND at<?",new String[]{""+from,""+to})){while(c.moveToNext())counts[java.time.Instant.ofEpochMilli(c.getLong(0)).atZone(zone).getHour()]++;}
  JSONArray out=new JSONArray();for(int n:counts)out.put(n);return out;
 }
}
