import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import './questions.css';
type Q={id:string;title:string;description:string};
export default function QuestionsParents({db}:{db:SupabaseClient|null}){
 const [items,setItems]=useState<Q[]>([]),[name,setName]=useState<Record<string,string>>({}),[answer,setAnswer]=useState<Record<string,string>>({}),[message,setMessage]=useState<Record<string,string>>({}),[busy,setBusy]=useState<string|null>(null);
 useEffect(()=>{if(!db)return;db.from('parent_questions').select('id,title,description').eq('status','published').order('created_at',{ascending:false}).then(({data})=>setItems(data||[]))},[db]);
 const send=async(e:React.FormEvent,id:string)=>{e.preventDefault();if(!db||busy)return;setBusy(id);const {error}=await db.rpc('submit_parent_question_answer',{p_question_id:id,p_answer:(answer[id]||'').trim(),p_parent_name:(name[id]||'').trim()||null});setBusy(null);if(error)setMessage({...message,[id]:'Envoi impossible : '+error.message});else{setMessage({...message,[id]:'Merci ! Votre réponse a été transmise au bureau.'});setAnswer({...answer,[id]:''})}};
 if(!items.length)return null;
 return <section className="questions-public"><h2>Votre avis nous intéresse</h2><p>Répondez aux questions posées par le bureau de l’APEL. Vos réponses ne sont pas affichées publiquement.</p>{items.map(q=><article className="question-card" key={q.id}><h3>{q.title}</h3>{q.description&&<p>{q.description}</p>}<form onSubmit={e=>void send(e,q.id)}><label>Votre réponse<textarea required minLength={2} maxLength={3000} rows={4} value={answer[q.id]||''} onChange={e=>setAnswer({...answer,[q.id]:e.target.value})}/></label><label>Votre prénom ou nom (facultatif)<input maxLength={120} value={name[q.id]||''} onChange={e=>setName({...name,[q.id]:e.target.value})}/></label><button type="submit" className="oudon-primary" disabled={busy===q.id}>{busy===q.id?'Envoi…':'Envoyer ma réponse'}</button>{message[q.id]&&<p role="status">{message[q.id]}</p>}</form></article>)}</section>
}
