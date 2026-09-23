import {initializeApp} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {getAuth, signInAnonymously, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {getFirestore, doc, setDoc, updateDoc, onSnapshot, arrayUnion} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* Firebase 콘솔에서 발급받은 config를 아래에 붙여 넣으세요. */
const firebaseConfig = {
  apiKey:"AIzaSyA6-kgw6HncPlex2ENNIu2N1EObEwPcSZ0",
  authDomain:"days-66f4e.firebaseapp.com",
  projectId:"days-66f4e",
  storageBucket:"days-66f4e.firebasestorage.app",
  messagingSenderId:"197221374574",
  appId:"1:197221374574:web:4c4300f0979113b587a47f",
  measurementId:"G-JT0XREEXNG"
};

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let uid=null, roomId=localStorage.getItem("roomId"), me=JSON.parse(localStorage.getItem("me")||"null"), unsubscribe=null;

const dateOnly=d=>new Date(d+"T00:00:00");
function dayIndex(room){let s=dateOnly(room.startDate),n=new Date();n=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.min(100,Math.max(1,Math.floor((n-s)/86400000)+1))}
function dateFor(room,n){let d=dateOnly(room.startDate);d.setDate(d.getDate()+n-1);return d}
function fmt(d){return d.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"})}
function streak(a,d){let n=0;for(let i=d-1;i>=0;i--){if(a[i])n++;else break}return n}
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}

async function boot(){await signInAnonymously(auth)}
onAuthStateChanged(auth,user=>{if(user){uid=user.uid;if(roomId)listen(roomId)}});

function show(id){["welcome","waiting","app"].forEach(x=>$("#"+x).hidden=x!==id)}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#createBox").hidden=b.dataset.tab!=="create";$("#joinBox").hidden=b.dataset.tab!=="join"});

$("#create").onclick=async()=>{
 if(!uid)return alert("잠시 후 다시 시도해주세요.");
 const name=$("#myName").value.trim(),goal=$("#myGoal").value.trim(),start=$("#startDate").value;
 if(!name||!goal||!start)return alert("이름, 목표, 시작일을 모두 입력해주세요.");
 const id=code(); const room={startDate:start,createdBy:uid,people:[{uid,name,goal,done:Array(100).fill(false)},{uid:null,name:"",goal:"",done:Array(100).fill(false)}],comments:[]};
 await setDoc(doc(db,"rooms",id),room); roomId=id;me={slot:0,name};localStorage.setItem("roomId",id);localStorage.setItem("me",JSON.stringify(me));listen(id);
};
$("#join").onclick=async()=>{
 const name=$("#joinName").value.trim(),id=$("#roomCode").value.trim().toUpperCase();if(!name||id.length!==6)return alert("이름과 6자리 코드를 입력해주세요.");
 roomId=id;me={slot:1,name};localStorage.setItem("roomId",id);localStorage.setItem("me",JSON.stringify(me));listen(id,true);
};
$("#copyCode").onclick=()=>navigator.clipboard?.writeText(roomId);
$("#leave").onclick=()=>{if(confirm("이 기기에서 챌린지를 나갈까요?")){localStorage.clear();location.reload()}};

function listen(id,joining=false){
 if(unsubscribe)unsubscribe();
 unsubscribe=onSnapshot(doc(db,"rooms",id),async snap=>{
   if(!snap.exists()){alert("존재하지 않는 초대코드입니다.");localStorage.clear();return location.reload()}
   let room=snap.data();
   if(joining && !room.people[1].uid){await updateDoc(doc(db,"rooms",id),{["people."+1]:{uid,name:me.name,goal:"목표를 설정해주세요",done:Array(100).fill(false)}});room=(await (await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js")).getDoc(doc(db,"rooms",id))).data()}
   if(!room.people[0].uid || !room.people[1].uid){show("waiting");$("#codeDisplay").textContent=id;$("#waitingText").textContent=room.people[1].uid?"상대방을 기다리는 중...":"친구가 참여하면 챌린지가 시작됩니다.";return}
   show("app");render(room);
 });
}
function render(room){
 const d=dayIndex(room), people=room.people;$("#leave").hidden=false;$("#dayNo").textContent=d;$("#dayProgress").style.width=d+"%";$("#dateText").textContent=fmt(dateFor(room,d));$("#todayLabel").textContent="DAY "+d;
 people.forEach((p,i)=>{$("#person"+i).innerHTML=`<h2>${esc(p.name)}</h2><div class="goal">🎯 ${esc(p.goal)}</div><div class="ring">${p.done.filter(Boolean).length}<span class="muted"> / 100일</span></div><div class="muted">연속 달성 ${streak(p.done,d)}일</div>`});
 $("#today").innerHTML=people.map((p,i)=>`<div class="today"><div class="today-top"><div><b>${esc(p.name)}</b><div class="muted">${esc(p.goal)}</div></div><button class="check ${p.done[d-1]?'done':''}" onclick="toggle(${i})">${p.done[d-1]?'✓ 달성했어요':'○ 미달성'}</button></div></div>`).join("");
 $("#calendar").innerHTML=people.map(p=>`<div style="margin-top:16px"><b>${esc(p.name)}</b><div class="calendar">${p.done.map((x,n)=>`<div class="day ${x?'done':''} ${n===d-1?'today':''}">${n+1}</div>`).join("")}</div></div>`).join("");
 const cs=room.comments||[];$("#comments").innerHTML=`<div class="comment-row"><input id="comment" maxlength="120" placeholder="상대방에게 응원 한마디"><button onclick="comment()">보내기</button></div>${cs.filter(c=>c.day===d).map(c=>`<div class="bubble">💌 ${esc(c.from)}: ${esc(c.text)}</div>`).join("")}`;
 $("#summary").innerHTML=`<div class="summary-grid">${people.map(p=>`<div class="summary-box"><b>${p.done.filter(Boolean).length}%</b>${esc(p.name)}<div class="muted">총 ${p.done.filter(Boolean).length}일 달성</div></div>`).join("")}</div>${people.every(p=>p.done.every(Boolean))?'<div class="finish">🎉 두 사람 모두 100일 완주!</div>':''}`;
}
window.toggle=async i=>{const ref=doc(db,"rooms",roomId);const snap=await (await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js")).getDoc(ref);const r=snap.data(),d=dayIndex(r)-1;if(r.people[i].uid!==uid)return alert("본인의 목표만 체크할 수 있어요.");const path=`people.${i}.done`;const arr=[...r.people[i].done];arr[d]=!arr[d];await updateDoc(ref,{[path]:arr})};
window.comment=async()=>{const input=$("#comment"),text=input.value.trim();if(!text)return;const d=dayIndex((await (await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js")).getDoc(doc(db,"rooms",roomId))).data());await updateDoc(doc(db,"rooms",roomId),{comments:arrayUnion({day:d,from:me.name,text,uid})});input.value=""};
boot();