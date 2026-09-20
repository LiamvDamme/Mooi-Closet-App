export function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function monthDays(year,month){const first=new Date(year,month,1),offset=(first.getDay()+6)%7,count=new Date(year,month+1,0).getDate();return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i<offset||i>=offset+count?null:dateKey(new Date(year,month,i-offset+1)));}
export function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return !Number.isNaN(d.getTime())&&dateKey(d)===value;}
