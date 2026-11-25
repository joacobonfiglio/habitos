package ar.pulso;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
 private WebView web;private final ExecutorService worker=Executors.newSingleThreadExecutor();private int period=0;private String month=java.time.YearMonth.now().toString();private boolean ready=false;private long generation=0;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);getWindow().setStatusBarColor(0xfff6f7f2);getWindow().setNavigationBarColor(0xfff6f7f2);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  web=new WebView(this);web.setBackgroundColor(0xfff6f7f2);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setDomStorageEnabled(false);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.addJavascriptInterface(new Bridge(),"Pulso");web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(!r.getUrl().toString().equals("https://pulso.local/"))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(Exception e){return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream("No se pudo cargar Pulso".getBytes()));}}
   @Override public void onPageFinished(WebView v,String url){ready=true;refresh();}
  });
  FrameLayout host=new FrameLayout(this);host.setBackgroundColor(0xfff6f7f2);host.addView(web,new FrameLayout.LayoutParams(-1,-1));
  if(Build.VERSION.SDK_INT>=30){
   getWindow().setDecorFitsSystemWindows(false);
   host.setOnApplyWindowInsetsListener((v,insets)->{
    android.graphics.Insets safe=insets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
    android.graphics.Insets keyboard=insets.getInsets(WindowInsets.Type.ime());
    int gap=(int)(8*getResources().getDisplayMetrics().density);
    // Resize the WebView viewport itself: padding WebView does not protect fixed CSS bars.
    v.setPadding(safe.left,safe.top,safe.right,Math.max(safe.bottom,keyboard.bottom)+gap);
    return WindowInsets.CONSUMED;
   });
  }else{host.setFitsSystemWindows(true);host.setPadding(0,0,0,(int)(8*getResources().getDisplayMetrics().density));}
  setContentView(host);host.requestApplyInsets();ArchiveJob.schedule(this);web.loadUrl("https://pulso.local/");
 }
 @Override public void onResume(){super.onResume();if(ready)refresh();}
 private void refresh(){
  final int requested=period;final String requestedMonth=month;final long version=++generation;
  worker.execute(()->{try{JSONObject data=History.read(this,requested,requestedMonth);data.put("cloud",CloudSync.status(this));runOnUiThread(()->{if(!isDestroyed()&&version==generation)web.evaluateJavascript("window.receive("+data+")",null);});if(requested==0)PulseWidget.updateAll(this,data);try{CloudSync.sync(this,false);data.put("cloud",CloudSync.status(this));runOnUiThread(()->{if(!isDestroyed()&&version==generation)web.evaluateJavascript("window.receive("+data+")",null);});}catch(Exception ignored){}}catch(Exception e){runOnUiThread(()->{if(!isDestroyed()&&version==generation)web.evaluateJavascript("window.showError('No se pudieron leer los datos. Revisá los permisos y volvé a intentar.')",null);});}});
 }
 private void cloudRefresh(){worker.execute(()->{try{CloudSync.sync(this,true);}catch(Exception ignored){}runOnUiThread(()->refresh());});}
 public class Bridge{
  @JavascriptInterface public void syncNow(){runOnUiThread(()->cloudRefresh());}
  @JavascriptInterface public void disconnectCloud(){runOnUiThread(()->new AlertDialog.Builder(MainActivity.this).setTitle("¿Desconectar LifeOS?").setMessage("Se detienen los envíos. Los registros del teléfono y de tu cuenta se conservan. También podés revocar el código desde LifeOS.").setNegativeButton("Cancelar",null).setPositiveButton("Desconectar",(d,w)->{CloudSync.disconnect(MainActivity.this);refresh();}).show());}
  @JavascriptInterface public void connectCloud(){runOnUiThread(()->{
   final EditText input=new EditText(MainActivity.this);input.setSingleLine(true);input.setHint("Código de vinculación");input.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
   new AlertDialog.Builder(MainActivity.this).setTitle("Conectar con LifeOS").setMessage("En LifeOS, abrí Conectar Pulso y generá un código. Al vincular se envían uso por aplicación, sesiones, horas y conteos de notificaciones. No se envían mensajes ni contenido de notificaciones.").setView(input).setNegativeButton("Cancelar",null).setPositiveButton("Vincular",(dialog,which)->{final String code=input.getText().toString();worker.execute(()->{try{CloudSync.connect(MainActivity.this,code);runOnUiThread(()->{Toast.makeText(MainActivity.this,"Teléfono vinculado",Toast.LENGTH_LONG).show();refresh();});}catch(Exception e){runOnUiThread(()->Toast.makeText(MainActivity.this,e.getMessage(),Toast.LENGTH_LONG).show());}});}).show();
  });}

  @JavascriptInterface public void exit(){runOnUiThread(()->finish());}
  @JavascriptInterface public void load(int value,String selected){runOnUiThread(()->{period=value==30?30:value==7?7:value==1?1:0;month=selected==null?java.time.YearMonth.now().toString():selected;refresh();});}
  @JavascriptInterface public void usagePermission(){runOnUiThread(()->open(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS,Uri.parse("package:"+getPackageName()))));}
  @JavascriptInterface public void notificationPermission(){runOnUiThread(()->open(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)));}
  @JavascriptInterface public void widget(){runOnUiThread(()->{AppWidgetManager m=getSystemService(AppWidgetManager.class);if(m.isRequestPinAppWidgetSupported())m.requestPinAppWidget(new ComponentName(MainActivity.this,PulseWidget.class),null,null);else new AlertDialog.Builder(MainActivity.this).setMessage("Mantené presionada la pantalla de inicio, entrá en Widgets y buscá Pulso.").setPositiveButton("Entendido",null).show();});}
  @JavascriptInterface public void clear(){runOnUiThread(()->new AlertDialog.Builder(MainActivity.this).setTitle("¿Borrar el registro de notificaciones?").setMessage("Se eliminarán los conteos guardados por Pulso. Las estadísticas del sistema Android no se borran.").setNegativeButton("Cancelar",null).setPositiveButton("Borrar",(d,w)->worker.execute(()->{try(NotificationStore s=new NotificationStore(MainActivity.this)){s.clear();}getSharedPreferences("pulso",0).edit().putLong("since",System.currentTimeMillis()).apply();runOnUiThread(()->refresh());})).show());}
 }
 private void open(Intent intent){try{startActivity(intent);}catch(ActivityNotFoundException e){Toast.makeText(this,"Abrí Ajustes → Aplicaciones → Acceso especial",Toast.LENGTH_LONG).show();}}
 @Override public void onBackPressed(){web.evaluateJavascript("window.back()",null);}
 @Override public void onDestroy(){worker.shutdown();web.removeJavascriptInterface("Pulso");web.destroy();super.onDestroy();}
}
