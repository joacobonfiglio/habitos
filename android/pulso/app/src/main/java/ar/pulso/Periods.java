package ar.pulso;
import java.time.*;
import java.time.temporal.ChronoUnit;
/** Calendar ranges are half-open; comparisons never include today's unfinished day. */
public final class Periods {
 public final LocalDate from,until,compareFrom,compareUntil,baselineFrom,baselineUntil;
 public final int type;
 public Periods(int type,YearMonth selected,LocalDate today){
  this.type=type;
  if(type==30){
   YearMonth current=YearMonth.from(today);if(selected.isAfter(current))selected=current;
   from=selected.atDay(1);until=selected.equals(current)?today.plusDays(1):selected.plusMonths(1).atDay(1);
   YearMonth previous=selected.minusMonths(1);
   int count=Math.min(selected.equals(current)?today.getDayOfMonth()-1:selected.lengthOfMonth(),previous.lengthOfMonth());
   compareFrom=from;compareUntil=from.plusDays(count);baselineFrom=previous.atDay(1);baselineUntil=baselineFrom.plusDays(count);
  }else if(type==7){from=today.minusDays(7);until=today;compareFrom=from;compareUntil=until;baselineFrom=from.minusDays(7);baselineUntil=from;
  }else{from=type==1?today.minusDays(1):today;until=from.plusDays(1);compareFrom=from;compareUntil=type==1?until:from;baselineFrom=from.minusDays(1);baselineUntil=type==1?from:baselineFrom;}
 }
 public int comparedDays(){return (int)ChronoUnit.DAYS.between(compareFrom,compareUntil);}
 public static Double change(long current,long previous){return previous==0?null:(current-previous)*100d/previous;}
}
