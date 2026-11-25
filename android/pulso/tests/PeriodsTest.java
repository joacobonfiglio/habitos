import ar.pulso.Periods;
import java.time.*;
public class PeriodsTest {
 static void check(boolean ok,String label){if(!ok)throw new AssertionError(label);System.out.println("PASS "+label);}
 public static void main(String[] args){
  LocalDate today=LocalDate.of(2026,10,25);
  Periods current=new Periods(30,YearMonth.of(2026,10),today);
  check(current.from.equals(LocalDate.of(2026,10,1))&&current.until.equals(LocalDate.of(2026,10,26)),"current month includes today");
  check(current.comparedDays()==24&&current.compareUntil.equals(today)&&current.baselineUntil.equals(LocalDate.of(2026,9,25)),"equal completed month days excludes today");
  Periods september=new Periods(30,YearMonth.of(2026,9),today);
  check(september.comparedDays()==30&&september.baselineUntil.equals(LocalDate.of(2026,8,31)),"30 vs 31 day months use same count");
  Periods march=new Periods(30,YearMonth.of(2024,3),today);
  check(march.comparedDays()==29&&march.baselineUntil.equals(LocalDate.of(2024,3,1)),"leap year February baseline");
  Periods first=new Periods(30,YearMonth.of(2026,10),LocalDate.of(2026,10,1));
  check(first.comparedDays()==0,"first day no premature comparison");
  Periods jan=new Periods(30,YearMonth.of(2026,1),today);
  check(jan.baselineFrom.equals(LocalDate.of(2025,12,1)),"January crosses year");
  Periods week=new Periods(7,YearMonth.from(today),today);
  check(week.from.equals(LocalDate.of(2026,10,18))&&week.until.equals(today)&&week.baselineFrom.equals(LocalDate.of(2026,10,11)),"consecutive seven complete days");
  Periods future=new Periods(30,YearMonth.of(2027,1),today);
  check(future.from.equals(current.from),"future month clamped");
  check(Periods.change(120,100)==20d,"increase percent");check(Periods.change(50,100)==-50d,"decrease percent");
  check(Periods.change(0,100)==-100d,"app no longer used");check(Periods.change(100,0)==null&&Periods.change(0,0)==null,"zero baseline no infinity");
  check(new Periods(0,YearMonth.from(today),today).comparedDays()==0,"today has no misleading full day comparison");
 }
}
