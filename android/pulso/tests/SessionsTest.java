import ar.pulso.Sessions;
import java.util.*;
public class SessionsTest {
 static Sessions.Event e(long t,String p,int type){return new Sessions.Event(t,p,type);}
 static void expect(String label,List<Sessions.Event> events,long from,long to,long total,int count){List<Sessions.Session> s=Sessions.calculate(events,from,to);long sum=0;for(Sessions.Session x:s)sum+=x.end-x.start;if(sum!=total||s.size()!=count)throw new AssertionError(label+": "+sum+" / "+s.size());System.out.println("PASS "+label);}
 public static void main(String[] args){
  expect("empty",Arrays.asList(),0,100,0,0);
  expect("app switch, no double count",Arrays.asList(e(10,"a",1),e(20,"b",1),e(22,"a",2),e(50,"b",2)),0,100,40,2);
  expect("screen off closes active session",Arrays.asList(e(10,"a",1),e(40,null,15)),0,100,30,1);
  expect("midnight clip",Arrays.asList(e(10,"a",1),e(80,"a",2)),50,100,30,1);
  expect("range end clip",Arrays.asList(e(10,"a",1)),0,50,40,1);
  expect("shutdown",Arrays.asList(e(10,"a",1),e(30,null,26)),0,100,20,1);
  expect("duplicate resumes",Arrays.asList(e(10,"a",1),e(20,"a",1),e(50,"a",2)),0,100,40,1);
  expect("missing resume",Arrays.asList(e(50,"a",2)),0,100,0,0);
  expect("internal activity at same instant",Arrays.asList(e(10,"a",1),e(20,"a",2),e(20,"a",1),e(50,"a",2)),0,100,40,1);
  expect("independent visits",Arrays.asList(e(10,"a",1),e(20,"a",2),e(30,"a",1),e(50,"a",2)),0,100,30,2);
  expect("events after range ignored",Arrays.asList(e(60,"a",1)),0,50,0,0);
 }
}
