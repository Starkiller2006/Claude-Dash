// pages/dashboard.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const SECTIONS = ["Command", "Business", "Fitness", "Sleep", "Finance", "Journal", "Focus", "Habits"];
const navIcons = { Command:"⚡", Business:"💼", Fitness:"🏋️", Sleep:"😴", Finance:"💰", Journal:"📓", Focus:"🎯", Habits:"🔥" };

const initialTodos = [
  { id:1, text:"Finalize Q3 revenue projections", done:false, priority:"high" },
  { id:2, text:"Follow up with client proposal", done:false, priority:"high" },
  { id:3, text:"Review marketing campaign metrics", done:true, priority:"medium" },
  { id:4, text:"Schedule team standup", done:false, priority:"low" },
];
const initialHabits = [
  { id:1, name:"Morning meditation", icon:"🧘", streak:12, done:false },
  { id:2, name:"Read 30 minutes", icon:"📖", streak:7, done:true },
  { id:3, name:"Cold shower", icon:"🚿", streak:5, done:false },
  { id:4, name:"No phone before 9am", icon:"📵", streak:3, done:true },
  { id:5, name:"Gratitude journal", icon:"✍️", streak:20, done:false },
  { id:6, name:"8 glasses of water", icon:"💧", streak:9, done:true },
];
const accounts = [
  { name:"Chase Checking", type:"checking", balance:8420.50, color:"#4ade80" },
  { name:"Marcus Savings", type:"savings", balance:34200.00, color:"#60a5fa" },
  { name:"Fidelity Brokerage", type:"investment", balance:89340.12, color:"#a78bfa" },
  { name:"Chase Sapphire", type:"credit", balance:-2140.30, color:"#f87171" },
  { name:"Business Checking", type:"business", balance:22780.00, color:"#fbbf24" },
];
const journalPrompts = [
  "What's one thing you can do today that your future self will thank you for?",
  "What's your #1 priority right now — and are your actions aligned with it?",
  "What would make today a 10/10 day?",
  "What fear is holding you back from your next level?",
];

function RecoveryRing({ score }) {
  const pct = score ?? 0;
  const color = pct >= 67 ? "#c8f264" : pct >= 34 ? "#fbbf24" : "#f87171";
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e1e2e" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition:"stroke-dasharray 1s ease" }}/>
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold"
        fontFamily="'Syne', sans-serif">{score ?? "–"}</text>
      <text x="50" y="60" textAnchor="middle" fill="#666" fontSize="9" fontFamily="'DM Mono', monospace">RECOVERY</text>
    </svg>
  );
}

function StatCard({ label, value, sub, color, loading }) {
  return (
    <div className="card">
      <div style={{ fontSize:11, color:"#555" }}>{label}</div>
      {loading
        ? <div style={{ height:36, background:"#1e1e2e", borderRadius:6, margin:"8px 0", animation:"shimmer 1.5s infinite" }}/>
        : <div className="stat-num" style={{ color }}>{value ?? "—"}</div>
      }
      <div style={{ fontSize:11, color:"#555", marginTop:4 }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [section, setSection] = useState("Command");
  const [whoop, setWhoop] = useState(null);
  const [whoopLoading, setWhoopLoading] = useState(true);
  const [whoopError, setWhoopError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [habits, setHabits] = useState(initialHabits);
  const [waterGlasses, setWaterGlasses] = useState(5);
  const [mood, setMood] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [focusMin, setFocusMin] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) { setTimerActive(false); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  const fetchWhoop = useCallback(async () => {
    setWhoopLoading(true);
    setWhoopError(null);
    try {
      const res = await fetch("/api/whoop/data");
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWhoop(data);
      setLastSynced(new Date());
    } catch (e) {
      setWhoopError(e.message);
    } finally {
      setWhoopLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWhoop();
    const t = setInterval(fetchWhoop, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchWhoop]);

  const recoveryScore = whoop?.recovery?.score ?? null;
  const hrv = whoop?.recovery?.hrv ? Math.round(whoop.recovery.hrv) : null;
  const restingHR = whoop?.recovery?.resting_hr ? Math.round(whoop.recovery.resting_hr) : null;
  const caloriesBurned = whoop?.today?.calories_burned ?? null;
  const strain = whoop?.today?.strain ? whoop.today.strain.toFixed(1) : null;
  const sleepTonight = whoop?.sleep?.[0] ?? null;
  const sleepHours = sleepTonight?.hours ?? null;
  const sleepPerf = sleepTonight?.performance_pct ? Math.round(sleepTonight.performance_pct) : null;
  const firstName = whoop?.profile?.first_name ?? "";
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const doneTodos = todos.filter(t => t.done).length;
  const doneHabits = habits.filter(h => h.done).length;
  const dailyScore = Math.round(((doneTodos/todos.length) + (doneHabits/habits.length)) / 2 * 100);
  const greet = () => { const h = currentTime.getHours(); return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening"; };
  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id:Date.now(), text:newTodo, done:false, priority:newPriority }]);
    setNewTodo("");
  };
  const recoveryColor = recoveryScore >= 67 ? "#c8f264" : recoveryScore >= 34 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", fontFamily:"'DM Mono','Courier New',monospace", color:"#e8e4dc", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#111;} ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
        .card{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:20px;}
        .card:hover{border-color:#2e2e4e;transition:border-color 0.2s;}
        .btn{background:#c8f264;color:#0a0a0f;border:none;border-radius:8px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;}
        .btn:hover{opacity:0.85;}
        .btn-ghost{background:transparent;color:#e8e4dc;border:1px solid #2e2e3e;border-radius:8px;padding:8px 16px;font-family:inherit;font-size:13px;cursor:pointer;}
        .btn-ghost:hover{border-color:#c8f264;color:#c8f264;}
        input,textarea,select{background:#0d0d16;border:1px solid #1e1e2e;border-radius:8px;color:#e8e4dc;font-family:inherit;padding:10px 14px;font-size:13px;outline:none;}
        input:focus,textarea:focus,select:focus{border-color:#c8f264;}
        .tag{border-radius:4px;padding:2px 8px;font-size:11px;font-weight:500;}
        .tag-high{background:#2d1515;color:#f87171;} .tag-medium{background:#1d1d0a;color:#fbbf24;} .tag-low{background:#0d1d10;color:#4ade80;}
        .progress-bar{height:6px;background:#1e1e2e;border-radius:3px;overflow:hidden;}
        .progress-fill{height:100%;border-radius:3px;transition:width 0.5s ease;}
        .nav-item{padding:10px 14px;border-radius:8px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:8px;transition:all 0.2s;color:#666;white-space:nowrap;}
        .nav-item:hover{color:#e8e4dc;background:#111118;} .nav-item.active{background:#c8f264;color:#0a0a0f;font-weight:500;}
        .stat-num{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;margin-top:4px;}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .check-circle{width:20px;height:20px;border-radius:50%;border:2px solid #2e2e3e;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;}
        .check-circle.done{background:#c8f264;border-color:#c8f264;}
        .water-dot{width:28px;height:28px;border-radius:50%;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #1e1e2e;}
        .water-dot.filled{background:#1a3a6a;border-color:#60a5fa;} .water-dot.empty{background:#111118;border-color:#1e1e2e;}
        .mood-btn{width:44px;height:44px;border-radius:50%;border:2px solid #1e1e2e;background:#111118;cursor:pointer;font-size:20px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
        .mood-btn:hover{border-color:#c8f264;transform:scale(1.1);} .mood-btn.selected{border-color:#c8f264;background:#1a1a0a;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        @keyframes shimmer{0%{opacity:0.4;}50%{opacity:0.8;}100%{opacity:0.4;}}
        .pulsing{animation:pulse 1.5s ease-in-out infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .fadein{animation:fadeUp 0.3s ease forwards;}
        .whoop-badge{display:inline-flex;align-items:center;gap:6px;background:#1a1a0a;border:1px solid #c8f264;border-radius:6px;padding:4px 10px;font-size:11px;color:#c8f264;}
      `}</style>

      <div style={{ padding:"16px 24px", borderBottom:"1px solid #1e1e2e", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#c8f264" }} className="pulsing"/>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, letterSpacing:"0.08em" }}>LIFEOS</span>
        </div>
        <div style={{ fontSize:13, color:"#666" }}>
          {currentTime.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          <span style={{ marginLeft:16, color:"#c8f264" }}>{currentTime.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {whoopLoading
            ? <span style={{ fontSize:11, color:"#666" }} className="pulsing">Syncing WHOOP...</span>
            : whoopError
              ? <button className="btn-ghost" style={{ fontSize:11, padding:"4px 10px", borderColor:"#f87171", color:"#f87171" }} onClick={fetchWhoop}>⚠ Retry WHOOP</button>
              : <span className="whoop-badge">🟢 WHOOP Live · {lastSynced?.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
          }
          <button className="btn-ghost" style={{ fontSize:11, padding:"4px 10px" }} onClick={fetchWhoop}>↻ Sync</button>
          <a href="/api/auth/logout" style={{ fontSize:11, color:"#444", textDecoration:"none" }}>Sign out</a>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ width:180, padding:"20px 12px", borderRight:"1px solid #1e1e2e", display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
          <div style={{ fontSize:10, color:"#444", letterSpacing:"0.1em", padding:"0 14px 8px" }}>NAVIGATE</div>
          {SECTIONS.map(s => (
            <div key={s} className={`nav-item ${section===s?"active":""}`} onClick={()=>setSection(s)}>
              <span>{navIcons[s]}</span>{s}
            </div>
          ))}
          <div style={{ marginTop:"auto", padding:"12px 14px", borderTop:"1px solid #1e1e2e" }}>
            <div style={{ fontSize:11, color:"#444", marginBottom:4 }}>Daily Score</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#c8f264" }}>{dailyScore}%</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }} className="fadein" key={section}>

          {section === "Command" && (
            <div>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800 }}>
                  {greet()}{firstName ? `, ${firstName}` : ""} 👋
                </div>
                <div style={{ color:"#666", fontSize:13, marginTop:4 }}>Here's your life at a glance.</div>
              </div>

              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#666", marginBottom:12 }}>HOW ARE YOU FEELING TODAY?</div>
                <div style={{ display:"flex", gap:10 }}>
                  {["😴","😔","😐","😊","🔥"].map((m,i) => (
                    <button key={i} className={`mood-btn ${mood===i?"selected":""}`} onClick={()=>setMood(i)}>{m}</button>
                  ))}
                  {mood !== null && <span style={{ alignSelf:"center", color:"#c8f264", fontSize:13, marginLeft:8 }}>Logged ✓</span>}
                </div>
              </div>

              <div className="card" style={{ marginBottom:16, display:"flex", alignItems:"center", gap:32 }}>
                <RecoveryRing score={recoveryScore}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#555", marginBottom:8 }}>WHOOP RECOVERY — TODAY</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                    {[
                      { label:"HRV", value: hrv ? `${hrv}ms` : null, color:"#60a5fa" },
                      { label:"Resting HR", value: restingHR ? `${restingHR}bpm` : null, color:"#f87171" },
                      { label:"Strain", value: strain ?? null, color:"#fbbf24" },
                      { label:"Cal Burned", value: caloriesBurned ? `${caloriesBurned}` : null, color:"#c8f264" },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize:11, color:"#555" }}>{s.label}</div>
                        {whoopLoading
                          ? <div style={{ height:28, background:"#1e1e2e", borderRadius:4, marginTop:4, animation:"shimmer 1.5s infinite" }}/>
                          : <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color, marginTop:2 }}>{s.value ?? "—"}</div>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
                <StatCard label="TASKS DONE" value={`${doneTodos}/${todos.length}`} sub="business tasks" color="#c8f264" />
                <StatCard label="HABITS DONE" value={`${doneHabits}/${habits.length}`} sub="daily habits" color="#60a5fa" />
                <StatCard label="SLEEP" value={sleepHours ? `${sleepHours}h` : null} sub={sleepPerf ? `${sleepPerf}% performance` : "last night"} color="#a78bfa" loading={whoopLoading} />
                <StatCard label="NET WORTH" value={`$${(totalBalance/1000).toFixed(1)}k`} sub="all accounts" color="#4ade80" />
              </div>

              <div className="grid2" style={{ marginBottom:16 }}>
                <div className="card">
                  <div style={{ fontSize:12, color:"#555", marginBottom:12 }}>TODAY'S PRIORITIES</div>
                  {todos.filter(t=>!t.done&&t.priority==="high").slice(0,3).map(t=>(
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div className={`check-circle ${t.done?"done":""}`} onClick={()=>setTodos(todos.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>
                        {t.done && <span style={{ fontSize:11, color:"#0a0a0f" }}>✓</span>}
                      </div>
                      <span style={{ fontSize:13 }}>{t.text}</span>
                    </div>
                  ))}
                  <button className="btn-ghost" style={{ width:"100%", marginTop:4 }} onClick={()=>setSection("Business")}>View All Tasks →</button>
                </div>
                <div className="card">
                  <div style={{ fontSize:12, color:"#555", marginBottom:12 }}>HABIT STREAKS</div>
                  {habits.slice(0,5).map(h=>(
                    <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span>{h.icon}</span>
                        <span style={{ fontSize:13 }}>{h.name}</span>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"#c8f264" }}>{h.streak}🔥</span>
                        <div className={`check-circle ${h.done?"done":""}`} onClick={()=>setHabits(habits.map(x=>x.id===h.id?{...x,done:!x.done}:x))}>
                          {h.done && <span style={{ fontSize:11, color:"#0a0a0f" }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid2">
                <div className="card">
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:12, color:"#555" }}>WATER INTAKE</div>
                    <span style={{ fontSize:12, color:"#60a5fa" }}>{waterGlasses}/8 glasses</span>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {Array.from({length:8},(_,i)=>(
                      <div key={i} className={`water-dot ${i<waterGlasses?"filled":"empty"}`} onClick={()=>setWaterGlasses(i+1)}>💧</div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize:12, color:"#555", marginBottom:8 }}>CALORIES BURNED TODAY</div>
                  {whoopLoading
                    ? <div style={{ height:36, background:"#1e1e2e", borderRadius:6, animation:"shimmer 1.5s infinite" }}/>
                    : <div className="stat-num" style={{ color:"#fbbf24" }}>{caloriesBurned ?? "—"}</div>
                  }
                  {caloriesBurned && (
                    <div style={{ marginTop:10 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width:`${Math.min(caloriesBurned/600*100,100)}%`, background:"#fbbf24" }}/>
                      </div>
                      <div style={{ fontSize:11, color:"#555", marginTop:4 }}>of 600 cal daily target</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === "Business" && (
            <div>
              <div className="section-title" style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>💼 Business HQ</div>
              <div className="grid2" style={{ marginBottom:16 }}>
                <div className="card" style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#555" }}>OPEN TASKS</div><div className="stat-num" style={{ color:"#c8f264" }}>{todos.filter(t=>!t.done).length}</div></div>
                <div className="card" style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#555" }}>COMPLETED</div><div className="stat-num" style={{ color:"#4ade80" }}>{todos.filter(t=>t.done).length}</div></div>
              </div>
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>ADD TASK</div>
                <div style={{ display:"flex", gap:10 }}>
                  <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="What needs to get done?" style={{ flex:1 }}/>
                  <select value={newPriority} onChange={e=>setNewPriority(e.target.value)} style={{ cursor:"pointer" }}>
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                  <button className="btn" onClick={addTodo}>Add</button>
                </div>
              </div>
              {["high","medium","low"].map(priority=>{
                const f=todos.filter(t=>t.priority===priority);
                if(!f.length) return null;
                return (
                  <div key={priority} className="card" style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <span className={`tag tag-${priority}`}>{priority.toUpperCase()}</span>
                      <span style={{ fontSize:12, color:"#555" }}>{f.filter(t=>!t.done).length} remaining</span>
                    </div>
                    {f.map(t=>(
                      <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #1e1e2e" }}>
                        <div className={`check-circle ${t.done?"done":""}`} onClick={()=>setTodos(todos.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>
                          {t.done&&<span style={{ fontSize:11, color:"#0a0a0f" }}>✓</span>}
                        </div>
                        <span style={{ flex:1, fontSize:14, textDecoration:t.done?"line-through":"none", color:t.done?"#444":"#e8e4dc" }}>{t.text}</span>
                        <button onClick={()=>setTodos(todos.filter(x=>x.id!==t.id))} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:16 }}>×</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {section === "Fitness" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700 }}>🏋️ Fitness — Live WHOOP</div>
                {!whoopLoading && !whoopError && <span className="whoop-badge">🟢 Live</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                <StatCard label="DAY STRAIN" value={strain} sub="out of 21 max" color="#fbbf24" loading={whoopLoading}/>
                <StatCard label="CAL BURNED" value={caloriesBurned ? `${caloriesBurned} kcal` : null} sub="active calories" color="#f87171" loading={whoopLoading}/>
                <StatCard label="HRV" value={hrv ? `${hrv} ms` : null} sub="heart rate variability" color="#60a5fa" loading={whoopLoading}/>
              </div>
              <div className="grid2" style={{ marginBottom:16 }}>
                <div className="card">
                  <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>BODY METRICS</div>
                  {[
                    { label:"Resting HR", value: restingHR ? `${restingHR} bpm` : null, color:"#f87171" },
                    { label:"Recovery Score", value: recoveryScore ? `${recoveryScore}%` : null, color:recoveryColor },
                    { label:"SpO2", value: whoop?.recovery?.spo2 ? `${whoop.recovery.spo2.toFixed(1)}%` : null, color:"#60a5fa" },
                    { label:"Skin Temp", value: whoop?.recovery?.skin_temp_celsius ? `${whoop.recovery.skin_temp_celsius.toFixed(1)}°C` : null, color:"#a78bfa" },
                  ].map(m=>(
                    <div key={m.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e1e2e" }}>
                      <span style={{ fontSize:13, color:"#888" }}>{m.label}</span>
                      {whoopLoading
                        ? <div style={{ width:60, height:16, background:"#1e1e2e", borderRadius:4, animation:"shimmer 1.5s infinite" }}/>
                        : <span style={{ fontSize:13, color: m.value ? m.color : "#444" }}>{m.value ?? "—"}</span>
                      }
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>RECENT WORKOUTS</div>
                  {whoopLoading
                    ? [1,2,3].map(i=><div key={i} style={{ height:40, background:"#1e1e2e", borderRadius:6, marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)
                    : whoop?.workouts?.length
                      ? whoop.workouts.slice(0,5).map((w,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e1e2e" }}>
                            <div>
                              <div style={{ fontSize:13 }}>Sport #{w.sport_id}</div>
                              <div style={{ fontSize:11, color:"#555" }}>{new Date(w.start).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:13, color:"#fbbf24" }}>Strain {w.strain?.toFixed(1) ?? "—"}</div>
                              <div style={{ fontSize:11, color:"#60a5fa" }}>{w.calories ? `${w.calories} kcal` : "—"}</div>
                            </div>
                          </div>
                        ))
                      : <div style={{ color:"#555", fontSize:13 }}>No workouts logged recently.</div>
                  }
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize:12, color:"#555", marginBottom:16 }}>7-DAY STRAIN HISTORY</div>
                <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:100 }}>
                  {whoopLoading
                    ? Array.from({length:7},(_,i)=><div key={i} style={{ flex:1, height:`${40+i*8}px`, background:"#1e1e2e", borderRadius:"4px 4px 0 0", animation:"shimmer 1.5s infinite" }}/>)
                    : (whoop?.cycles ?? []).slice(0,7).reverse().map((c,i)=>{
                        const s = c.strain ?? 0;
                        const h = Math.max(8, (s/21)*100);
                        const col = s>=14?"#c8f264":s>=7?"#fbbf24":"#60a5fa";
                        return (
                          <div key={i} style={{ flex:1, textAlign:"center" }}>
                            <div style={{ height:`${h}px`, background:col, borderRadius:"4px 4px 0 0", marginBottom:4 }}/>
                            <div style={{ fontSize:10, color:"#555" }}>{new Date(c.start).toLocaleDateString("en-US",{weekday:"short"})}</div>
                            <div style={{ fontSize:10, color:col }}>{s.toFixed(1)}</div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            </div>
          )}

          {section === "Sleep" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700 }}>😴 Sleep — Live WHOOP</div>
                {!whoopLoading && !whoopError && <span className="whoop-badge">🟢 Live</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                <StatCard label="LAST NIGHT" value={sleepHours ? `${sleepHours}h` : null} sub="total sleep" color="#a78bfa" loading={whoopLoading}/>
                <StatCard label="SLEEP PERF" value={sleepPerf ? `${sleepPerf}%` : null} sub="WHOOP score" color="#60a5fa" loading={whoopLoading}/>
                <StatCard label="DISTURBANCES" value={sleepTonight?.disturbances ?? null} sub="last night" color="#fbbf24" loading={whoopLoading}/>
              </div>
              {!whoopLoading && sleepTonight && (
                <div className="card" style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>SLEEP STAGES</div>
                  {[
                    { label:"Light Sleep", pct:sleepTonight.stages.light_pct, color:"#60a5fa" },
                    { label:"Slow Wave (Deep)", pct:sleepTonight.stages.slow_wave_pct, color:"#a78bfa" },
                    { label:"REM Sleep", pct:sleepTonight.stages.rem_pct, color:"#c8f264" },
                  ].map(s=>(
                    <div key={s.label} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:13 }}>{s.label}</span>
                        <span style={{ fontSize:12, color:s.color }}>{s.pct ? `${Math.round(s.pct)}%` : "—"}</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width:`${s.pct ?? 0}%`, background:s.color }}/></div>
                    </div>
                  ))}
                </div>
              )}
              <div className="card">
                <div style={{ fontSize:12, color:"#555", marginBottom:16 }}>7-NIGHT HISTORY</div>
                {whoopLoading
                  ? [1,2,3,4,5,6,7].map(i=><div key={i} style={{ height:30, background:"#1e1e2e", borderRadius:6, marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)
                  : (whoop?.sleep ?? []).slice(0,7).reverse().map((s,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                        <span style={{ fontSize:12, color:"#555", width:32 }}>{new Date(s.start).toLocaleDateString("en-US",{weekday:"short"})}</span>
                        <div style={{ flex:1 }}>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width:`${Math.min(s.hours/10*100,100)}%`, background:s.hours>=7?"#a78bfa":"#f87171" }}/>
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:s.hours>=7?"#a78bfa":"#f87171", width:28 }}>{s.hours}h</span>
                        {s.performance_pct && <span style={{ fontSize:11, color:"#555" }}>{Math.round(s.performance_pct)}%</span>}
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {section === "Finance" && (
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>💰 Financial Overview</div>
              <div className="card" style={{ marginBottom:16, textAlign:"center" }}>
                <div style={{ fontSize:12, color:"#555" }}>TOTAL NET WORTH</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:800, color:"#4ade80", margin:"8px 0" }}>
                  ${totalBalance.toLocaleString("en-US",{minimumFractionDigits:2})}
                </div>
                <div style={{ fontSize:13, color:"#4ade80" }}>↑ +$1,240 this month</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                {accounts.map(a=>(
                  <div className="card" key={a.name} style={{ borderLeft:`3px solid ${a.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#555", marginBottom:4 }}>{a.type.toUpperCase()}</div>
                        <div style={{ fontSize:14 }}>{a.name}</div>
                      </div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:a.balance<0?"#f87171":a.color }}>
                        {a.balance<0?"-":""}${Math.abs(a.balance).toLocaleString("en-US",{minimumFractionDigits:2})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "Journal" && (
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>📓 Daily Journal</div>
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#c8f264", marginBottom:8 }}>TODAY'S PROMPT</div>
                <div style={{ fontSize:16, lineHeight:1.6, fontStyle:"italic", color:"#aaa" }}>"{journalPrompts[0]}"</div>
              </div>
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#555", marginBottom:12 }}>YOUR ENTRY</div>
                <textarea value={journalText} onChange={e=>setJournalText(e.target.value)} placeholder="Start writing..." rows={10} style={{ width:"100%", resize:"vertical", lineHeight:1.8 }}/>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                  <span style={{ fontSize:12, color:"#555" }}>{journalText.length} characters</span>
                  <button className="btn">Save Entry</button>
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>DAILY WINS</div>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
                    <span style={{ color:"#c8f264", fontSize:14 }}>{i+1}.</span>
                    <input placeholder={`Win #${i+1}`} style={{ flex:1 }}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "Focus" && (
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>🎯 Focus Mode</div>
              <div className="card" style={{ textAlign:"center", padding:"48px 24px", marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#555", marginBottom:20, letterSpacing:"0.1em" }}>{timerActive?"DEEP WORK IN PROGRESS":"POMODORO TIMER"}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:72, fontWeight:800, color:timerActive?"#c8f264":"#e8e4dc", marginBottom:8 }} className={timerActive?"pulsing":""}>
                  {fmtTime(timeLeft)}
                </div>
                <div style={{ fontSize:13, color:"#555", marginBottom:32 }}>{timerActive?"Stay locked in.":"Select a duration and start"}</div>
                <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:24 }}>
                  {[25,45,60,90].map(m=>(
                    <button key={m} className="btn-ghost" style={{ borderColor:focusMin===m?"#c8f264":"#2e2e3e", color:focusMin===m?"#c8f264":"#666" }}
                      onClick={()=>{setFocusMin(m);setTimeLeft(m*60);setTimerActive(false);}}>
                      {m}m
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:12 }}>
                  <button className="btn" style={{ padding:"12px 32px", fontSize:15 }} onClick={()=>setTimerActive(!timerActive)}>
                    {timerActive?"⏸ Pause":"▶ Start"}
                  </button>
                  <button className="btn-ghost" onClick={()=>{setTimerActive(false);setTimeLeft(focusMin*60);}}>Reset</button>
                </div>
              </div>
            </div>
          )}

          {section === "Habits" && (
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 }}>🔥 Habit Tracker</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                <div className="card" style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#555" }}>TODAY'S PROGRESS</div><div className="stat-num" style={{ color:"#c8f264" }}>{doneHabits}/{habits.length}</div></div>
                <div className="card" style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#555" }}>BEST STREAK</div><div className="stat-num" style={{ color:"#fbbf24" }}>20 days</div></div>
                <div className="card" style={{ textAlign:"center" }}><div style={{ fontSize:11, color:"#555" }}>AVG COMPLETION</div><div className="stat-num" style={{ color:"#60a5fa" }}>71%</div></div>
              </div>
              <div className="card">
                <div style={{ fontSize:12, color:"#555", marginBottom:14 }}>TODAY'S HABITS</div>
                {habits.map(h=>(
                  <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1e1e2e" }}>
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <span style={{ fontSize:22 }}>{h.icon}</span>
                      <div><div style={{ fontSize:14 }}>{h.name}</div><div style={{ fontSize:12, color:"#fbbf24" }}>🔥 {h.streak} day streak</div></div>
                    </div>
                    <div className={`check-circle ${h.done?"done":""}`} style={{ width:28, height:28 }} onClick={()=>setHabits(habits.map(x=>x.id===h.id?{...x,done:!x.done}:x))}>
                      {h.done&&<span style={{ fontSize:13, color:"#0a0a0f" }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
