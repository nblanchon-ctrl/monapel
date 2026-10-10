import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
type Notice={id:string;message:string;created_at:string;read_at:string|null};
export default function NotificationsPanel({db}:{db:SupabaseClient}){
 const[items,setItems]=useState<Notice[]>([]),[error,setError]=useState('');
 const load=async()=>{const {data,error}=await db.from('apel_notifications').select('id,message,created_at,read_at').order('created_at',{ascending:false}).limit(30);if(error)setError(error.message);else setItems(data||[])};
 useEffect(()=>{void load()},[db]);
 const mark=async(id:string)=>{const {error}=await db.from('apel_notifications').update({read_at:new Date().toISOString()}).eq('id',id);if(error)setError(error.message);else void load()};
 return <details className="op-notifications"><summary>Notifications {items.filter(x=>!x.read_at).length>0?`(${items.filter(x=>!x.read_at).length} nouvelles)`:''}</summary><button type="button" onClick={()=>void load()}>Actualiser</button>{error&&<p role="alert">{error}</p>}{items.map(n=><div key={n.id} className="op-request-row"><span>{n.message}</span> <small>{new Date(n.created_at).toLocaleString('fr-FR')}</small>{!n.read_at&&<button type="button" onClick={()=>void mark(n.id)}>Marquer comme lue</button>}</div>)}{items.length===0&&<p>Aucune notification.</p>}</details>;
}
