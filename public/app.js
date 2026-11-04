const $ = s => document.querySelector(s);
const API_BASE = (window.NEXORA_API_BASE || "").replace(/\/$/, "");
const apiUrl = path => `${API_BASE}${path}`;
async function readApiResponse(response) {
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch {
    const preview = raw.replace(/\\s+/g, " ").slice(0, 180);
    throw new Error(`Server mengembalikan respons bukan JSON (HTTP ${response.status}). ${preview || "Respons kosong"}`);
  }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
const messagesEl = $("#messages"), promptEl = $("#prompt"), welcome = $("#welcome");
let messages = [], chatId = null, busy = false;

function addMessage(role, content) {
  welcome.style.display = "none";
  const row = document.createElement("div"); row.className = `message ${role}`;
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = role === "assistant" ? "N" : "K";
  const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.textContent = content;
  row.append(avatar, bubble); messagesEl.append(row); row.scrollIntoView({behavior:"smooth",block:"end"});
  return bubble;
}
function resetChat(){messages=[];chatId=null;messagesEl.innerHTML="";welcome.style.display="block";promptEl.focus();}
async function loadHistory(){
  try { const rows=await readApiResponse(await fetch(apiUrl("/api/chats"))); const box=$("#history");box.innerHTML="";
    rows.forEach(c=>{const b=document.createElement("button");b.textContent=c.title;b.onclick=async()=>{const d=await readApiResponse(await fetch(apiUrl(`/api/chats/${c.id}`)));messages=d.messages;chatId=c.id;messagesEl.innerHTML="";welcome.style.display="none";messages.forEach(m=>addMessage(m.role,m.content));};box.append(b);});
  } catch {}
}
async function sendMessage(text){
  if(busy || !text.trim()) return;
  busy=true;$("#send").disabled=true;
  messages.push({role:"user",content:text.trim()});addMessage("user",text.trim());promptEl.value="";
  const loading=addMessage("assistant","NEXORA sedang berpikir…");loading.classList.add("typing");
  try{
    const r=await fetch(apiUrl("/api/chat"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,chatId})});
    const data=await readApiResponse(r);
    chatId=data.chatId;loading.classList.remove("typing");loading.textContent=data.answer;
    messages.push({role:"assistant",content:data.answer});await loadHistory();
  }catch(e){loading.classList.remove("typing");loading.textContent="⚠️ "+e.message;}
  finally{busy=false;$("#send").disabled=false;promptEl.focus();}
}
$("#composer").addEventListener("submit",e=>{e.preventDefault();sendMessage(promptEl.value);});
promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#composer").requestSubmit();}});
$("#newChat").onclick=resetChat;
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>sendMessage(b.dataset.prompt));
fetch(apiUrl("/api/config")).then(readApiResponse).then(c=>{$("#status").textContent=c.configured?`Terhubung · ${c.model}`:"API key belum dipasang";}).catch(()=>{$("#status").textContent="Backend belum ditemukan — periksa config.js";});
loadHistory();
