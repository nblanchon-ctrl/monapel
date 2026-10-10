import React,{useEffect,useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import './calendar.css';
type CalendarEvent={id:string;title:string;description:string|null;event_date:string;visibility:string;project_id:string|null};
type Props={db:SupabaseClient|null;publicOnly?:boolean};
const dayKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export default function EventsCalendar({db,publicOnly=false}:Props){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [selected,setSelected]=useState<string|null>(null);
 const [events,setEvents]=useState<CalendarEvent[]>([]);
 const [error,setError]=useState('');
 useEffect(()=>{if(!db)return;let live=true;const q=db.from('events').select('id,title,description,event_date,visibility,project_id').gte('event_date',dayKey(month)).lt('event_date',dayKey(new Date(month.getFullYear(),month.getMonth()+1,1))).order('event_date');(publicOnly?q.eq('visibility','public'):q).then(({data,error})=>{if(!live)return;if(error)setError(error.message);else{setError('');setEvents(data||[])}});return()=>{live=false}},[db,month.getFullYear(),month.getMonth(),publicOnly]);
 const offset=(month.getDay()+6)%7;
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i-offset+1);
 const grouped=useMemo(()=>{const m=new Map<string,CalendarEvent[]>();for(const ev of events){const key=ev.event_date.slice(0,10);m.set(key,[...(m.get(key)||[]),ev])}return m},[events]);
 const chosen=selected?grouped.get(selected)||[]:[];
 return <section className="apel-calendar"><header className="apel-calendar-header"><div><h2>{month.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</h2><p>{publicOnly?'Événements publiés pour les parents':'Agenda du bureau — événements internes et publiés'}</p></div><div className="apel-calendar-nav"><button onClick={()=>{setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1));setSelected(null)}} aria-label="Mois précédent">‹</button><button onClick={()=>{setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1));setSelected(null)}} aria-label="Mois suivant">›</button></div></header>{error&&<p role="alert">Chargement de l'agenda impossible : {error}</p>}<div className="apel-calendar-grid">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(x=><div className="apel-calendar-week" key={x}>{x}</div>)}{cells.map((n,i)=>{const key=n>=1&&n<=count?dayKey(new Date(month.getFullYear(),month.getMonth(),n)):'';const items=grouped.get(key)||[];return key?<button key={key} className={'apel-calendar-day'+(selected===key?' is-selected':'')} onClick={()=>setSelected(key)} aria-label={`${n} ${month.toLocaleDateString('fr-FR',{month:'long'})}, ${items.length} événement(s)`}><span>{n}</span>{items.length>0&&<span className="apel-calendar-dots">{items.slice(0,3).map(e=><i key={e.id} title={e.title}/>)}</span>}</button>:<div key={`empty-${i}`} className="apel-calendar-empty"/>})}</div>{selected&&<div className="apel-calendar-detail"><h3>{new Date(selected+'T12:00:00').toLocaleDateString('fr-FR',{dateStyle:'full'})}</h3>{chosen.length?chosen.map(e=><article key={e.id}><strong>{e.title}</strong>{!publicOnly&&<small>{e.visibility==='public'?'Publié auprès des parents':'Privé — bureau'}</small>}<p>{e.description||''}</p></article>):<p>Aucun événement ce jour.</p>}</div>}</section>;
}
