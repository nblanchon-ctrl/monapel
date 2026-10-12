import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import './PushOptIn.css';
type Props={db:SupabaseClient|null;kind:'public'|'bureau';userId?:string|null};
const PUBLIC_KEY=import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY||'';
function toBytes(base64:string){const padded=(base64+'='.repeat((4-base64.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(padded),c=>c.charCodeAt(0));}
export default function PushOptIn({db,kind,userId}:Props){
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const supported=typeof window!=='undefined'&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
 useEffect(()=>{if(!supported)return;let active=true;const path=kind==='public'?'/sw-oudon.js':'/bureau/sw-bureau.js';const scope=kind==='public'?'/saint-joseph-oudon':'/bureau/';navigator.serviceWorker.getRegistration(scope).then(r=>r?.pushManager.getSubscription()).then(s=>{if(active)setEnabled(!!s)}).catch(()=>{});return()=>{active=false}},[kind,supported]);
 async function activate(){if(!db||!supported||!PUBLIC_KEY){setMessage('Les notifications ne sont pas encore configurées.');return}if(kind==='bureau'&&!userId){setMessage('Connectez-vous au Bureau pour activer les notifications.');return}setBusy(true);setMessage('');try{
  const permission=await Notification.requestPermission();if(permission!=='granted'){setMessage('Autorisation refusée. Vérifiez les réglages du téléphone.');return}
  const path=kind==='public'?'/sw-oudon.js':'/bureau/sw-bureau.js',scope=kind==='public'?'/saint-joseph-oudon':'/bureau/';
  const registration=await navigator.serviceWorker.register(path,{scope});await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:toBytes(PUBLIC_KEY) as BufferSource});
  const json=subscription.toJSON();const {error}=await db.from('pwa_push_subscriptions').upsert({endpoint:subscription.endpoint,p256dh:json.keys?.p256dh,auth:json.keys?.auth,audience:kind,user_id:kind==='bureau'?userId:null,updated_at:new Date().toISOString()},{onConflict:'endpoint'});if(error)throw error;setEnabled(true);setMessage('Notifications activées sur cet appareil.');
 }catch(e){setMessage('Activation impossible : '+(e instanceof Error?e.message:String(e)))}finally{setBusy(false)}}
 async function deactivate(){if(!db)return;setBusy(true);try{const reg=await navigator.serviceWorker.getRegistration(kind==='public'?'/saint-joseph-oudon':'/bureau/');const sub=await reg?.pushManager.getSubscription();if(sub){await db.from('pwa_push_subscriptions').delete().eq('endpoint',sub.endpoint);await sub.unsubscribe()}setEnabled(false);setMessage('Notifications désactivées.')}catch(e){setMessage(String(e))}finally{setBusy(false)}}
 if(!supported)return null;
 return <div className="push-optin"><div><strong>Notifications {kind==='public'?'de l’APEL':'du Bureau'}</strong><p>{kind==='public'?'Recevez les nouvelles actualités et les événements publiés.':'Recevez les nouvelles activités du Bureau, même quand l’application est fermée.'}</p>{message&&<small role="status">{message}</small>}</div><button type="button" disabled={busy} onClick={enabled?deactivate:activate}>{busy?'Un instant…':enabled?'Désactiver':'Activer les notifications'}</button></div>
}
