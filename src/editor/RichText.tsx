import React from 'react';
// Affichage React sans injection HTML : les contenus parents ne peuvent pas injecter de scripts.
function inline(text:string):React.ReactNode[]{
 const regex=/(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|==([^=]+)==|__([^_]+)__|\*([^*\n]+)\*)/g;
 const result:React.ReactNode[]=[];let cursor=0;let m:RegExpExecArray|null;
 while((m=regex.exec(text))){if(m.index>cursor)result.push(text.slice(cursor,m.index));const k=result.length;
 if(m[2]&&m[3])result.push(<a key={k} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
 else if(m[4])result.push(<strong key={k}>{m[4]}</strong>);
 else if(m[5])result.push(<mark key={k}>{m[5]}</mark>);
 else if(m[6])result.push(<u key={k}>{m[6]}</u>);
 else if(m[7])result.push(<em key={k}>{m[7]}</em>);
 cursor=regex.lastIndex;
 }if(cursor<text.length)result.push(text.slice(cursor));return result;
}
export default function RichText({value}:{value:string}){return <div className="news-rich-text">{value.split(/\n\s*\n/).map((paragraph,i)=>{const lines=paragraph.split('\n');if(lines.every(l=>l.startsWith('- ')))return <ul key={i}>{lines.map((l,j)=><li key={j}>{inline(l.slice(2))}</li>)}</ul>;if(paragraph.startsWith('## '))return <h3 key={i}>{inline(paragraph.slice(3))}</h3>;return <p key={i} style={{whiteSpace:'pre-line'}}>{lines.map((l,j)=><React.Fragment key={j}>{j>0?'\n':null}{inline(l)}</React.Fragment>)}</p>})}</div>}
