package ar.pulso;
import android.app.job.*;
import android.content.*;
public class ArchiveJob extends JobService {
 private volatile boolean stopped;
 public static void schedule(Context c){JobScheduler scheduler=c.getSystemService(JobScheduler.class);if(scheduler.getPendingJob(2202)==null)scheduler.schedule(new JobInfo.Builder(2202,new ComponentName(c,ArchiveJob.class)).setPeriodic(6*60*60*1000L).setPersisted(true).build());}
 public boolean onStartJob(JobParameters p){stopped=false;new Thread(()->{boolean retry=false;try{History.sync(this);CloudSync.sync(this,false);}catch(Exception e){retry=true;}final boolean failed=retry;new android.os.Handler(getMainLooper()).post(()->{if(!stopped)jobFinished(p,failed);});},"pulso-history").start();return true;}
 public boolean onStopJob(JobParameters p){stopped=true;return true;}
}
