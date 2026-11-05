/* Deliberately conservative: ambiguous or invalid dates remain task text. */
(function (root) {
  'use strict';
  const zone = 'America/Anchorage';
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  function today(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now);
    const part = name => parts.find(p => p.type === name).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  const key = d => d.toISOString().slice(0,10);
  function validDate(y,m,d) {
    const date = new Date(Date.UTC(y,m,d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m && date.getUTCDate() === d ? key(date) : '';
  }
  function parse(text, now = new Date()) {
    const base = new Date(today(now)+'T12:00:00Z');
    const tokens = [];
    let date = '', time = '', match;
    // Only one scheduling date is interpreted. Multiple dates are ambiguous.
    const datePattern = /\b(?:(?:on|by|due)\s+)?(?:today|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{4}-\d{2}-\d{2}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b/gi;
    const candidates = [...text.matchAll(datePattern)];
    if (candidates.length === 1) {
      match = candidates[0];
      const value = match[0].toLowerCase().replace(/^(on|by|due)\s+/, '');
      if (value === 'today' || value === 'tomorrow') {
        const d = new Date(base); if(value === 'tomorrow') d.setUTCDate(d.getUTCDate()+1); date=key(d);
      } else if (/^(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(value)) {
        const weekday = dayNames.indexOf(value.replace(/^next\s+/,''));
        let offset=(weekday-base.getUTCDay()+7)%7;
        if (value.startsWith('next ') && offset === 0) offset=7;
        const d=new Date(base);d.setUTCDate(d.getUTCDate()+offset);date=key(d);
      } else if (/^\d{4}-/.test(value)) {
        const [y,m,d]=value.split('-').map(Number);date=validDate(y,m-1,d);
      } else {
        const m=value.match(/^([a-z]+)\s+(\d+)(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/);
        if(m){const month=months.findIndex(name=>name.startsWith(m[1]));let year=m[3]?+m[3]:base.getUTCFullYear();date=validDate(year,month,+m[2]);if(date&&!m[3]&&date<today(now))date=validDate(year+1,month,+m[2]);}
      }
      if(date)tokens.push({kind:'date',start:match.index,end:match.index+match[0].length});
    }
    const timeMatches=[...text.matchAll(/\b(?:at\s+)?(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)|(\d{1,2}):(\d{2}))\b/gi)];
    if(timeMatches.length===1){
      const m=timeMatches[0];let h=Number(m[1]||m[4]),minute=Number(m[2]||m[5]||0);const meridiem=m[3]?.toLowerCase();
      if(minute<60 && (meridiem?h>=1&&h<=12:h>=0&&h<=23)){
        if(meridiem)h=h%12+(meridiem==='pm'?12:0);
        time=String(h).padStart(2,'0')+':'+String(minute).padStart(2,'0');tokens.push({kind:'time',start:m.index,end:m.index+m[0].length});
      }
    }
    return {date,time,tokens,title:clean(text,tokens)};
  }
  function clean(text,tokens){let result=text;[...tokens].sort((a,b)=>b.start-a.start).forEach(t=>{result=result.slice(0,t.start)+result.slice(t.end)});return result.replace(/\s+/g,' ').trim();}
  const api={parse,clean,today};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TaskDates=api;
})(typeof window==='object'?window:globalThis);
