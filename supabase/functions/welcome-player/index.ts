// Transactional welcome only. Never subscribes players to marketing lists.
const WELCOME_TEXT = {
 fr: {subject:'Bienvenue dans le cercle Youthseiko !',title:'Bienvenue,',body:'Votre première connexion est réussie. Yuki, Hana, Rei, Mio et Masaru vous souhaitent la bienvenue ! Votre espace joueur vous attend : choisissez votre personnage préféré et faites comme chez vous.',cta:'Retrouver mon espace',note:'Ce message de bienvenue ne vous inscrit pas à la newsletter.'},
 en: {subject:'Welcome to the Youthseiko circle!',title:'Welcome,',body:'Your first sign-in was successful. Yuki, Hana, Rei, Mio and Masaru welcome you! Your player space is ready: choose your favourite character and make yourself at home.',cta:'Open my player space',note:'This welcome message does not subscribe you to the newsletter.'},
 ja: {subject:'Youthseikoのサークルへようこそ！',title:'ようこそ、',body:'初めてのログインが完了しました。ユキ、ハナ、レイ、ミオ、マサルがあなたを歓迎します！プレイヤースペースで好きなキャラクターを選んで、ゆっくりお楽しみください。',cta:'マイスペースを開く',note:'この歓迎メールによってニュースレターに登録されることはありません。'}
};
function welcomeContent(language: string, nickname: string, imageUrl: string, siteBase='https://youthseiko.github.io') {
 const lang = ['fr','en','ja'].includes(language) ? language as keyof typeof WELCOME_TEXT : 'fr';
 const t=WELCOME_TEXT[lang];
 const esc=(value: string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
 const greeting=nickname.trim() ? `${t.title} ${nickname.trim()}${lang==='ja'?'さん！':' !'}` : t.subject;
 const url=`${siteBase}/${lang}/communaute/`;
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.subject)}</title></head><body style="margin:0;background:#fff8f1;color:#292638;font-family:Arial,sans-serif"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td align="center" style="padding:24px 12px"><table role="presentation" style="width:100%;max-width:640px;background:#fffdf9;border:1px solid #e4cddd;border-radius:20px;overflow:hidden"><tr><td><img src="${esc(imageUrl)}" width="640" height="427" alt="Yuki, Hana, Rei, Mio, Masaru — Welcome" style="display:block;width:100%;height:auto;border:0"></td></tr><tr><td style="padding:28px"><p style="color:#982d67;font-weight:bold;letter-spacing:2px">✦ YOUTHSEIKO</p><h1 style="font-family:Georgia,serif;font-size:30px">${esc(greeting)}</h1><p style="line-height:1.8">${esc(t.body)}</p><p style="margin:28px 0"><a href="${esc(url)}" style="display:inline-block;padding:14px 22px;background:#982d67;color:white;border-radius:10px;text-decoration:none;font-weight:bold">${esc(t.cta)}</a></p><p style="font-size:12px;color:#766372;line-height:1.6">${esc(t.note)}<br>© Youthseiko · <a href="mailto:youthseiko@gmail.com" style="color:#766372">youthseiko@gmail.com</a></p></td></tr></table></td></tr></table></body></html>`;
 return {subject:t.subject,html,text:`${greeting}\n\n${t.body}\n\n${url}\n\n${t.note}`};
}
Deno.serve(async (request: Request) => {
 const origin=request.headers.get('origin')??'';
 const allowed=(Deno.env.get('ALLOWED_ORIGINS')??'https://youthseiko.github.io').split(',');
 const headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(status: number,body: object)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed.includes(origin))return reply(403,{error:'forbidden'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,{error:'method'});
 const bearer=request.headers.get('authorization')??'';
 if(!bearer.startsWith('Bearer '))return reply(401,{error:'unauthorized'});
 let key: string;
 try { key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); }
 catch{return reply(503,{error:'unavailable'});}
 const base=Deno.env.get('SUPABASE_URL');
 if(!base||!key)return reply(503,{error:'unavailable'});
 const adminHeaders: Record<string,string>={apikey:key,'Content-Type':'application/json'};
 if(!key.startsWith('sb_secret_'))adminHeaders.Authorization=`Bearer ${key}`;
 const rpc=async(name: string,body: object)=>{
  const response=await fetch(`${base}/rest/v1/rpc/${name}`,{method:'POST',headers:adminHeaders,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('database_unavailable');
  return response.json();
 };
 let user: {id: string,email: string,email_confirmed_at?: string,last_sign_in_at?: string};
 try{
  const auth=await fetch(`${base}/auth/v1/user`,{headers:{apikey:key,Authorization:bearer},signal:AbortSignal.timeout(15000)});
  if(!auth.ok)return reply(401,{error:'unauthorized'});
  user=await auth.json();
 }catch{return reply(503,{error:'unavailable'});}
 if(!user.id||!user.email||!user.email_confirmed_at||!user.last_sign_in_at)return reply(401,{error:'unauthorized'});
 // Activation is deliberately separate from deploying the function or signing in.
 const mailKey=Deno.env.get('BREVO_WELCOME_API_KEY');
 const image=Deno.env.get('WELCOME_IMAGE_URL')??'https://img.mailinblue.com/12627388/images/content_library/original/6afc4cae492ee872f8d06ea1.png';
 if(Deno.env.get('WELCOME_ENABLED')!=='true'||!mailKey)return reply(202,{state:'pending_setup'});
 try{const url=new URL(image);if(url.protocol!=='https:'||!['youthseiko.github.io','img.mailinblue.com'].includes(url.hostname))return reply(503,{error:'image_unavailable'});}catch{return reply(503,{error:'image_unavailable'});}
 let language='fr',nickname='';
 try { const body=await request.json(); if(['fr','en','ja'].includes(body.language))language=body.language; } catch {/* Default locale for an empty request. */}
 try{
  const profile=await fetch(`${base}/rest/v1/player_profiles?id=eq.${encodeURIComponent(user.id)}&select=display_name,language`,{headers:{apikey:key,Authorization:bearer},signal:AbortSignal.timeout(15000)});
  if(!profile.ok)return reply(503,{error:'unavailable'});
  const rows=await profile.json();language=rows[0]?.language||language;nickname=rows[0]?.display_name||'';
 }catch{return reply(503,{error:'unavailable'});}
 let delivery: {delivery_id: string,claim_token: string}|null;
 try{delivery=await rpc('claim_welcome_email',{p_user_id:user.id});}catch{return reply(503,{error:'unavailable'});}
 if(!delivery)return reply(200,{state:'already_handled'});
 const finish=async(state: string,code: string|null=null,messageId: string|null=null)=>rpc('finish_welcome_email',{p_user_id:user.id,p_claim_token:delivery!.claim_token,p_state:state,p_message_id:messageId,p_error_code:code});
 const content=welcomeContent(language,nickname,image);
 let provider: Response;
 try{
  provider=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':mailKey,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({sender:{name:'Youthseiko',email:'youthseiko@gmail.com'},to:[{email:user.email}],subject:content.subject,htmlContent:content.html,textContent:content.text,headers:{idempotencyKey:delivery.delivery_id},tags:['youthseiko-welcome']}),signal:AbortSignal.timeout(20000)});
 }catch{
  // Acceptance is uncertain after a network failure: never retry automatically.
  try{await finish('review','provider_outcome_unknown');}catch{/* The claim remains locked for review. */}
  return reply(202,{state:'review'});
 }
 if(provider.ok){
  let messageId=null;try{messageId=(await provider.json()).messageId||null;}catch{/* Accepted response without an identifier. */}
  try{await finish('accepted',null,messageId);}catch{return reply(202,{state:'review'});}
  return reply(200,{state:'accepted'});
 }
 // A 429 is an explicit rejection; other provider failures require operator review.
 try{await finish(provider.status===429?'queued':'failed',`provider_${provider.status}`);}catch{/* Keep the reservation; do not risk a duplicate. */}
 return reply(202,{state:provider.status===429?'retry_later':'failed'});
});
