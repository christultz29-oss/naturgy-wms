import { useState, useEffect, useMemo, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://kaxobrtzmiwviffuydcg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZvbCU47r0OISweBliM9FBg_v0w-P-cE";

const db = {
  async get(table) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.json();
  },
  async getMov() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/movimientos?select=*&order=id.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async patch(codigo, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventario?codigo=eq.${encodeURIComponent(codigo)}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return r.json();
  }
};

const AREAS = ["Todas","Aislamiento y Protección","Alumbrado Público","Accesorios Varios","Barras y Bornas","Cables y Conductores","Conectores y Empalmes","Detección y Monitoreo","Estructuras y Soportes","Herrajes de Línea","Materiales Generales","Medición y Transformación","Protección y Maniobra","Tuberías y Ductos"];

function getTotal(i) { return (i.stock_bodega || 0) + (i.stock_area || 0); }
function getEstado(i) {
  const t = getTotal(i);
  if (t <= 0) return "⚠️ Sin Stock";
  if (t < (i.stock_min || 5)) return "⚠️ Stock Bajo";
  return "✅ En Stock";
}

const Ico = ({ n, s = 16 }) => {
  const p = { dashboard:"M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z", inventory:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9 3h2v2h-2v-2zm0 4h2v2h-2v-2zM6 10h2v2H6v-2zm0 4h2v2H6v-2zm8 0h2v2h-2v-2zm0-4h2v2h-2v-2z", movements:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", dispatch:"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4M14 12v4", reception:"M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4", kpi:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", plus:"M12 4v16m8-8H4", alert:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", x:"M6 18L18 6M6 6l12 12", menu:"M4 6h16M4 12h16M4 18h16", bolt:"M13 10V3L4 14h7v7l9-11h-7z", transfer:"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", refresh:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", check:"M5 13l4 4L19 7" };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={p[n]||p.bolt}/></svg>;
};

export default function App() {
  const [mod, setMod] = useState("dashboard");
  const [inv, setInv] = useState([]);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState(true);
  const [sync, setSync] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([db.get("inventario"), db.getMov()]);
      setInv(Array.isArray(a) ? a : []);
      setMovs(Array.isArray(b) ? b : []);
      setSync(new Date().toLocaleTimeString("es-CL"));
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const doMov = useCallback(async ({ codigo, tipo, cantidad, usuario, origen, destino, comentario, ot }) => {
    const item = inv.find(i => i.codigo === codigo);
    if (!item) return { error: "Código no encontrado" };
    const qty = parseInt(cantidad);
    let nb = item.stock_bodega || 0, na = item.stock_area || 0;
    if (tipo === "Entrada") { nb += qty; }
    else if (tipo === "Salida") { if (nb < qty) return { error: `Solo hay ${nb} en bodega` }; nb -= qty; }
    else if (tipo === "Transferencia") { if (nb < qty) return { error: `Solo hay ${nb} en bodega` }; nb -= qty; na += qty; }
    else if (tipo === "Ajuste") { nb = qty; }
    const fecha = new Date().toISOString().split("T")[0];
    await Promise.all([
      db.patch(codigo, { stock_bodega: nb, stock_area: na, ultimo_movimiento: fecha, updated_at: new Date().toISOString() }),
      db.insert("movimientos", { fecha, tipo, codigo, nombre: item.nombre, area: item.area, cantidad: qty, usuario: usuario || "Sistema", origen: origen || "—", destino: destino || "—", comentario: comentario || "", ot: ot || "" })
    ]);
    await load();
    return { ok: true };
  }, [inv, load]);

  const critical = inv.filter(i => getTotal(i) < (i.stock_min || 5));
  const totalStock = inv.reduce((s, i) => s + getTotal(i), 0);
  const exactitud = inv.length > 0 ? Math.round((inv.filter(i => getTotal(i) >= (i.stock_min || 5)).length / inv.length) * 100) : 0;

  const MODS = [
    { id:"dashboard", label:"Dashboard", icon:"dashboard" },
    { id:"inventory", label:"Inventario", icon:"inventory" },
    { id:"reception", label:"Recepción", icon:"reception" },
    { id:"dispatch", label:"Despacho", icon:"dispatch" },
    { id:"transfer", label:"Transferencia", icon:"transfer" },
    { id:"movements", label:"Movimientos", icon:"movements" },
    { id:"kpi", label:"KPIs", icon:"kpi" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0a0e1a", color:"#e2e8f0", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} button:hover{opacity:0.85}`}</style>
      {/* SIDEBAR */}
      <aside style={{ width:sidebar?220:64, minWidth:sidebar?220:64, background:"#0f1629", borderRight:"1px solid #1e2d4a", display:"flex", flexDirection:"column", transition:"all .25s", overflow:"hidden" }}>
        <div style={{ padding:"18px 14px", borderBottom:"1px solid #1e2d4a", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ico n="bolt" s={18}/></div>
          {sidebar && <div><div style={{ fontWeight:800, fontSize:13, letterSpacing:1, color:"#f59e0b" }}>NATURGY</div><div style={{ fontSize:9, color:"#64748b", letterSpacing:2 }}>WMS v1.0</div></div>}
        </div>
        <nav style={{ flex:1, padding:"10px 7px", display:"flex", flexDirection:"column", gap:2 }}>
          {MODS.map(m => (
            <button key={m.id} onClick={() => setMod(m.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:8, border:"none", cursor:"pointer", textAlign:"left", background:mod===m.id?"linear-gradient(135deg,#1d4ed8,#2563eb)":"transparent", color:mod===m.id?"#fff":"#94a3b8", fontSize:13, fontWeight:mod===m.id?600:400, whiteSpace:"nowrap", overflow:"hidden" }}>
              <span style={{ flexShrink:0 }}><Ico n={m.icon} s={16}/></span>
              {sidebar && m.label}
              {m.id==="inventory" && critical.length>0 && sidebar && <span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{critical.length}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebar(p=>!p)} style={{ margin:"10px 7px", padding:"8px", borderRadius:8, border:"1px solid #1e2d4a", background:"transparent", color:"#64748b", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Ico n="menu" s={15}/></button>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
        <header style={{ padding:"13px 24px", borderBottom:"1px solid #1e2d4a", background:"#0f1629", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h1 style={{ margin:0, fontSize:16, fontWeight:700, color:"#f1f5f9" }}>{MODS.find(m=>m.id===mod)?.label}</h1>
            {sync && <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>Sync: {sync}</div>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {critical.length>0 && <div style={{ display:"flex", alignItems:"center", gap:6, background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"5px 10px" }}><Ico n="alert" s={12}/><span style={{ fontSize:10, color:"#fca5a5" }}>{critical.length} bajo mínimo</span></div>}
            <button onClick={load} disabled={loading} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1px solid #1e2d4a", background:"transparent", color:loading?"#475569":"#94a3b8", cursor:loading?"not-allowed":"pointer", fontSize:11 }}>
              <Ico n="refresh" s={12}/> {loading?"Cargando...":"Actualizar"}
            </button>
          </div>
        </header>
        <div style={{ flex:1, padding:22, overflow:"auto" }}>
          {loading && inv.length===0 ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, flexDirection:"column", gap:14 }}>
              <div style={{ width:36, height:36, border:"3px solid #1e2d4a", borderTop:"3px solid #3b82f6", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
              <div style={{ color:"#475569", fontSize:12 }}>Conectando con Supabase...</div>
            </div>
          ) : (
            <>
              {mod==="dashboard" && <Dashboard inv={inv} movs={movs} exactitud={exactitud} totalStock={totalStock} critical={critical}/>}
              {mod==="inventory" && <InvMod inv={inv}/>}
              {mod==="reception" && <RecMod inv={inv} doMov={doMov}/>}
              {mod==="dispatch" && <DisMod inv={inv} doMov={doMov}/>}
              {mod==="transfer" && <TrfMod inv={inv} doMov={doMov}/>}
              {mod==="movements" && <MovMod movs={movs}/>}
              {mod==="kpi" && <KpiMod inv={inv} movs={movs} exactitud={exactitud}/>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ inv, movs, exactitud, totalStock, critical }) {
  const zero = inv.filter(i => getTotal(i)===0);
  const areaMap = useMemo(() => {
    const m = {};
    inv.forEach(i => { const t=getTotal(i); if(!m[i.area])m[i.area]={total:0,items:0,crit:0}; m[i.area].total+=t; m[i.area].items++; if(t<i.stock_min)m[i.area].crit++; });
    return Object.entries(m).sort((a,b)=>b[1].total-a[1].total);
  }, [inv]);
  const kpis = [
    { label:"Total Ítems", value:inv.length, color:"#3b82f6", sub:"en catálogo" },
    { label:"Stock Total", value:totalStock.toLocaleString(), color:"#10b981", sub:"unidades" },
    { label:"Exactitud", value:exactitud+"%", color:"#8b5cf6", sub:"sobre stock mínimo" },
    { label:"Sin Stock", value:zero.length, color:"#ef4444", sub:"requieren pedido" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {kpis.map((k,i) => (
          <div key={i} style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#f87171", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}><Ico n="alert" s={13}/>Alertas ({critical.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:240, overflowY:"auto" }}>
            {critical.slice(0,10).map(item => { const t=getTotal(item); return (
              <div key={item.codigo} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 9px", background:"#1a0f0f", borderRadius:7, border:"1px solid #450a0a" }}>
                <div><div style={{ fontSize:9, fontWeight:600, color:"#fca5a5" }}>{item.codigo}</div><div style={{ fontSize:8, color:"#6b7280", maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.nombre}</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:12, fontWeight:700, color:t===0?"#ef4444":"#f59e0b" }}>{t}</div><div style={{ fontSize:8, color:"#6b7280" }}>mín {item.stock_min}</div></div>
              </div>
            );})}
            {critical.length===0 && <div style={{ color:"#64748b", fontSize:11, padding:8 }}>✅ Todos sobre stock mínimo</div>}
          </div>
        </div>
        <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:10 }}>Stock por Categoría</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {areaMap.slice(0,7).map(([area,s]) => { const pct=totalStock>0?(s.total/totalStock)*100:0; return (
              <div key={area}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}><span style={{ fontSize:9, color:"#94a3b8" }}>{area}</span><span style={{ fontSize:9, color:"#64748b" }}>{s.total}</span></div><div style={{ height:5, background:"#1e2d4a", borderRadius:3 }}><div style={{ height:"100%", borderRadius:3, width:pct+"%", background:s.crit>0?"#ef4444":"#3b82f6" }}/></div></div>
            );})}
          </div>
        </div>
      </div>
      <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:10 }}>Últimos Movimientos</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead><tr style={{ borderBottom:"1px solid #1e2d4a" }}>{["Fecha","Tipo","Código","Material","Cant.","Usuario"].map(h=><th key={h} style={{ textAlign:"left", padding:"6px 9px", color:"#475569", fontWeight:600, fontSize:10 }}>{h}</th>)}</tr></thead>
          <tbody>
            {movs.slice(0,7).map(m=>(
              <tr key={m.id} style={{ borderBottom:"1px solid #0a0e1a" }}>
                <td style={{ padding:"7px 9px", color:"#64748b" }}>{m.fecha}</td>
                <td style={{ padding:"7px 9px" }}><span style={{ padding:"2px 6px", borderRadius:5, fontSize:9, fontWeight:700, background:m.tipo==="Entrada"?"#064e3b":m.tipo==="Salida"?"#450a0a":"#1e3a5f", color:m.tipo==="Entrada"?"#34d399":m.tipo==="Salida"?"#f87171":"#60a5fa" }}>{m.tipo}</span></td>
                <td style={{ padding:"7px 9px", color:"#93c5fd", fontFamily:"monospace", fontSize:9 }}>{m.codigo}</td>
                <td style={{ padding:"7px 9px", color:"#94a3b8", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.nombre}</td>
                <td style={{ padding:"7px 9px", fontWeight:700, color:"#f1f5f9" }}>{m.cantidad}</td>
                <td style={{ padding:"7px 9px", color:"#64748b" }}>{m.usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvMod({ inv }) {
  const [q, setQ] = useState(""); const [af, setAf] = useState("Todas"); const [sf, setSf] = useState("Todos"); const [sel, setSel] = useState(null);
  const filtered = useMemo(() => inv.filter(i => { const t=getTotal(i); const e=getEstado(i); return (!q||i.codigo.toLowerCase().includes(q.toLowerCase())||i.nombre.toLowerCase().includes(q.toLowerCase()))&&(af==="Todas"||i.area===af)&&(sf==="Todos"||e===sf); }), [inv,q,af,sf]);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}><span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#475569" }}><Ico n="search" s={12}/></span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar código o nombre..." style={{ ...IS(), paddingLeft:28 }}/></div>
        <select value={af} onChange={e=>setAf(e.target.value)} style={SS()}>{AREAS.map(a=><option key={a}>{a}</option>)}</select>
        <select value={sf} onChange={e=>setSf(e.target.value)} style={SS()}>{["Todos","✅ En Stock","⚠️ Stock Bajo","⚠️ Sin Stock"].map(s=><option key={s}>{s}</option>)}</select>
        <div style={{ padding:"7px 12px", background:"#1e2d4a", borderRadius:8, fontSize:10, color:"#64748b", display:"flex", alignItems:"center" }}>{filtered.length} ítems</div>
      </div>
      <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto", maxHeight:"calc(100vh - 290px)", overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
            <thead style={{ position:"sticky", top:0, background:"#0a0e1a", zIndex:1 }}><tr>{["Código","Nombre","Categoría","Bodega","Área","Total","Mín","Estado"].map(h=><th key={h} style={{ textAlign:"left", padding:"9px 11px", color:"#475569", fontWeight:600, fontSize:10, borderBottom:"1px solid #1e2d4a", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((item,idx) => { const t=getTotal(item); const e=getEstado(item); const sc=e==="✅ En Stock"?{bg:"#064e3b",tx:"#6ee7b7"}:e==="⚠️ Stock Bajo"?{bg:"#713f12",tx:"#fde68a"}:{bg:"#7f1d1d",tx:"#fca5a5"}; return (
                <tr key={item.codigo} onClick={()=>setSel(item)} style={{ borderBottom:"1px solid #0a0e1a", cursor:"pointer", background:idx%2===0?"transparent":"#080c18" }} onMouseEnter={e=>e.currentTarget.style.background="#1e2d4a"} onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"transparent":"#080c18"}>
                  <td style={{ padding:"8px 11px", fontFamily:"monospace", color:"#93c5fd", fontSize:9 }}>{item.codigo}</td>
                  <td style={{ padding:"8px 11px", color:"#e2e8f0", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.nombre}</td>
                  <td style={{ padding:"8px 11px", color:"#64748b", fontSize:9 }}>{item.area}</td>
                  <td style={{ padding:"8px 11px", color:"#f1f5f9", textAlign:"center" }}>{item.stock_bodega}</td>
                  <td style={{ padding:"8px 11px", color:"#f1f5f9", textAlign:"center" }}>{item.stock_area}</td>
                  <td style={{ padding:"8px 11px", fontWeight:700, color:"#f1f5f9", textAlign:"center" }}>{t}</td>
                  <td style={{ padding:"8px 11px", color:"#475569", textAlign:"center" }}>{item.stock_min}</td>
                  <td style={{ padding:"8px 11px" }}><span style={{ padding:"2px 6px", borderRadius:5, fontSize:9, fontWeight:700, background:sc.bg, color:sc.tx }}>{e}</span></td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
      {sel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setSel(null)}>
          <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:16, padding:24, width:440, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}><div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace" }}>{sel.codigo}</div><button onClick={()=>setSel(null)} style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer" }}><Ico n="x" s={15}/></button></div>
            <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:14 }}>{sel.nombre}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["Categoría",sel.area],["Ubicación",sel.ubicacion||"—"],["Stock Bodega",sel.stock_bodega],["Stock Área",sel.stock_area],["Stock Total",getTotal(sel)],["Stock Mínimo",sel.stock_min],["Estado",getEstado(sel)],["Último Mov.",sel.ultimo_movimiento||"—"]].map(([k,v])=>(
                <div key={k} style={{ background:"#0a0e1a", borderRadius:8, padding:"9px 11px" }}><div style={{ fontSize:9, color:"#475569", marginBottom:2 }}>{k}</div><div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0" }}>{String(v)}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MForm({ title, color, icon, inv, doMov, tipo, btnLabel, btnColor, origenOpts, destinoOpts, showOT }) {
  const [f, setF] = useState({ codigo:"", cantidad:"", usuario:"", origen:origenOpts?.[0]||"", destino:destinoOpts?.[0]||"", ot:"", comentario:"" });
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const item = inv.find(i=>i.codigo===f.codigo);
  const submit = async () => {
    if (!item) return setMsg({ e:true, t:"Código no encontrado" });
    if (!f.cantidad||parseInt(f.cantidad)<=0) return setMsg({ e:true, t:"Cantidad inválida" });
    setBusy(true);
    const res = await doMov({ ...f, tipo });
    setBusy(false);
    if (res.error) return setMsg({ e:true, t:res.error });
    setMsg({ e:false, t:`✅ ${btnLabel} exitoso — ${f.cantidad} und. de ${item.nombre}` });
    setF(p=>({ ...p, codigo:"", cantidad:"", ot:"", comentario:"" }));
    setTimeout(()=>setMsg(null), 4000);
  };
  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color, marginBottom:16, display:"flex", alignItems:"center", gap:7 }}><Ico n={icon} s={15}/>{title}</div>
        {msg && <div style={{ padding:"8px 12px", borderRadius:7, marginBottom:12, background:msg.e?"#450a0a":"#064e3b", color:msg.e?"#f87171":"#34d399", fontSize:11 }}>{msg.t}</div>}
        <FF l="Código de Ítem"><input value={f.codigo} onChange={e=>setF(p=>({...p,codigo:e.target.value}))} placeholder="ej. 329543" style={IS()}/>
          {item && <div style={{ marginTop:4, padding:"6px 9px", background:getTotal(item)>0?"#0a2212":"#2d0a0a", border:`1px solid ${getTotal(item)>0?"#064e3b":"#7f1d1d"}`, borderRadius:7, fontSize:9, color:getTotal(item)>0?"#6ee7b7":"#f87171" }}>{getTotal(item)>0?"✅":"⚠️"} {item.nombre} — Bod: {item.stock_bodega} | Área: {item.stock_area}</div>}
          {f.codigo&&!item&&<div style={{ marginTop:3, fontSize:9, color:"#f87171" }}>⚠️ Código no encontrado</div>}
        </FF>
        <FF l="Cantidad"><input type="number" min="1" value={f.cantidad} onChange={e=>setF(p=>({...p,cantidad:e.target.value}))} placeholder="0" style={IS()}/></FF>
        {showOT && <FF l="OT / Orden de Trabajo"><input value={f.ot} onChange={e=>setF(p=>({...p,ot:e.target.value}))} placeholder="ej. OT-44512" style={IS()}/></FF>}
        {origenOpts && <FF l="Origen"><select value={f.origen} onChange={e=>setF(p=>({...p,origen:e.target.value}))} style={IS()}>{origenOpts.map(o=><option key={o}>{o}</option>)}</select></FF>}
        {destinoOpts && <FF l="Destino"><select value={f.destino} onChange={e=>setF(p=>({...p,destino:e.target.value}))} style={IS()}>{destinoOpts.map(o=><option key={o}>{o}</option>)}</select></FF>}
        <FF l="Responsable"><input value={f.usuario} onChange={e=>setF(p=>({...p,usuario:e.target.value}))} placeholder="Nombre del operario" style={IS()}/></FF>
        <FF l="Comentario"><input value={f.comentario} onChange={e=>setF(p=>({...p,comentario:e.target.value}))} placeholder="Observaciones..." style={IS()}/></FF>
        <button onClick={submit} disabled={busy} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:"100%", padding:"10px 18px", background:busy?"#374151":btnColor, border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:busy?"not-allowed":"pointer", marginTop:4 }}>
          {busy?"Guardando en Supabase...":<><Ico n="check" s={14}/>{btnLabel}</>}
        </button>
      </div>
    </div>
  );
}

const RecMod = ({inv,doMov}) => <MForm title="Ingreso de Material" color="#34d399" icon="reception" inv={inv} doMov={doMov} tipo="Entrada" btnLabel="Registrar Ingreso" btnColor="#10b981" origenOpts={["Proveedor","Devolución","Transferencia Interna","Ajuste"]}/>;
const DisMod = ({inv,doMov}) => <MForm title="Salida / Despacho" color="#f87171" icon="dispatch" inv={inv} doMov={doMov} tipo="Salida" btnLabel="Registrar Despacho" btnColor="#ef4444" destinoOpts={["Campo","Vehículo BOL","Área Operativa","Mantenimiento","Otro"]} showOT/>;
const TrfMod = ({inv,doMov}) => <MForm title="Transferencia Bodega → Área" color="#60a5fa" icon="transfer" inv={inv} doMov={doMov} tipo="Transferencia" btnLabel="Registrar Transferencia" btnColor="#3b82f6"/>;

function MovMod({ movs }) {
  const [ft, setFt] = useState("Todos");
  const filtered = ft==="Todos"?movs:movs.filter(m=>m.tipo===ft);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", gap:7 }}>{["Todos","Entrada","Salida","Transferencia","Ajuste"].map(t=><button key={t} onClick={()=>setFt(t)} style={{ padding:"6px 13px", borderRadius:8, border:"1px solid", cursor:"pointer", fontSize:11, fontWeight:600, background:ft===t?"#1d4ed8":"transparent", color:ft===t?"#fff":"#64748b", borderColor:ft===t?"#1d4ed8":"#1e2d4a" }}>{t}</button>)}</div>
      <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead><tr style={{ background:"#0a0e1a" }}>{["Fecha","Tipo","Código","Material","Cant.","Usuario","OT","Comentario"].map(h=><th key={h} style={{ textAlign:"left", padding:"9px 11px", color:"#475569", fontWeight:600, fontSize:10, borderBottom:"1px solid #1e2d4a", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((m,i)=>(
              <tr key={m.id} style={{ borderBottom:"1px solid #0a0e1a", background:i%2===0?"transparent":"#080c18" }}>
                <td style={{ padding:"7px 11px", color:"#64748b" }}>{m.fecha}</td>
                <td style={{ padding:"7px 11px" }}><span style={{ padding:"2px 6px", borderRadius:5, fontSize:9, fontWeight:700, background:m.tipo==="Entrada"?"#064e3b":m.tipo==="Salida"?"#450a0a":"#1e3a5f", color:m.tipo==="Entrada"?"#34d399":m.tipo==="Salida"?"#f87171":"#60a5fa" }}>{m.tipo}</span></td>
                <td style={{ padding:"7px 11px", fontFamily:"monospace", color:"#93c5fd", fontSize:9 }}>{m.codigo}</td>
                <td style={{ padding:"7px 11px", color:"#94a3b8", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.nombre}</td>
                <td style={{ padding:"7px 11px", fontWeight:700, color:"#f1f5f9" }}>{m.cantidad}</td>
                <td style={{ padding:"7px 11px", color:"#64748b" }}>{m.usuario}</td>
                <td style={{ padding:"7px 11px", color:"#475569" }}>{m.ot||"—"}</td>
                <td style={{ padding:"7px 11px", color:"#475569" }}>{m.comentario||"—"}</td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={8} style={{ padding:22, textAlign:"center", color:"#475569" }}>Sin movimientos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiMod({ inv, movs, exactitud }) {
  const zero = inv.filter(i=>getTotal(i)===0).length;
  const low = inv.filter(i=>{const t=getTotal(i);return t>0&&t<i.stock_min;}).length;
  const units = inv.reduce((s,i)=>s+getTotal(i),0);
  const ent = movs.filter(m=>m.tipo==="Entrada").reduce((s,m)=>s+m.cantidad,0);
  const sal = movs.filter(m=>m.tipo==="Salida").reduce((s,m)=>s+m.cantidad,0);
  const fill = ent>0?Math.round((sal/ent)*100):0;
  const kpis = [
    {l:"Exactitud de Inventario",v:exactitud+"%",c:exactitud>=80?"#10b981":"#f59e0b",t:"≥ 95%",s:`${inv.length-zero-low}/${inv.length} ítems OK`},
    {l:"Fill Rate",v:fill+"%",c:fill>=90?"#10b981":"#f59e0b",t:"≥ 90%",s:`${sal} salidas / ${ent} entradas`},
    {l:"Sin Stock",v:zero,c:zero===0?"#10b981":"#ef4444",t:"= 0",s:"ítems en cero"},
    {l:"Stock Bajo Mínimo",v:low,c:low===0?"#10b981":"#f59e0b",t:"= 0",s:"requieren reposición"},
    {l:"Total Unidades",v:units.toLocaleString(),c:"#3b82f6",t:"—",s:"bodega + área"},
    {l:"Movimientos",v:movs.length,c:"#8b5cf6",t:"—",s:"en historial"},
  ];
  const byArea = useMemo(()=>{
    const m={};
    inv.forEach(i=>{const t=getTotal(i);if(!m[i.area])m[i.area]={items:0,sin:0,bajo:0,ok:0};m[i.area].items++;if(t===0)m[i.area].sin++;else if(t<i.stock_min)m[i.area].bajo++;else m[i.area].ok++;});
    return Object.entries(m).sort((a,b)=>b[1].ok-a[1].ok);
  },[inv]);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {kpis.map((k,i)=>(
          <div key={i} style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><div style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", letterSpacing:1 }}>{k.l}</div><div style={{ fontSize:9, color:"#475569" }}>Meta: {k.t}</div></div>
            <div style={{ fontSize:26, fontWeight:800, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:9, color:"#475569", marginTop:4 }}>{k.s}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#0f1629", border:"1px solid #1e2d4a", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e2d4a", fontSize:11, fontWeight:700, color:"#94a3b8" }}>Disponibilidad por Categoría</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead><tr style={{ background:"#0a0e1a" }}>{["Categoría","Ítems","✅ OK","⚠️ Bajo","❌ Cero","% Disponible"].map(h=><th key={h} style={{ textAlign:"left", padding:"8px 13px", color:"#475569", fontWeight:600, fontSize:10, borderBottom:"1px solid #1e2d4a" }}>{h}</th>)}</tr></thead>
          <tbody>
            {byArea.map(([area,s],i)=>{const pct=Math.round((s.ok/s.items)*100);return(
              <tr key={area} style={{ borderBottom:"1px solid #0a0e1a", background:i%2===0?"transparent":"#080c18" }}>
                <td style={{ padding:"8px 13px", color:"#e2e8f0" }}>{area}</td>
                <td style={{ padding:"8px 13px", color:"#64748b" }}>{s.items}</td>
                <td style={{ padding:"8px 13px", color:"#34d399" }}>{s.ok}</td>
                <td style={{ padding:"8px 13px", color:"#fbbf24" }}>{s.bajo}</td>
                <td style={{ padding:"8px 13px", color:"#f87171" }}>{s.sin}</td>
                <td style={{ padding:"8px 13px" }}><div style={{ display:"flex", alignItems:"center", gap:7 }}><div style={{ flex:1, height:5, background:"#1e2d4a", borderRadius:3 }}><div style={{ height:"100%", borderRadius:3, width:pct+"%", background:pct>=80?"#10b981":pct>=50?"#f59e0b":"#ef4444" }}/></div><span style={{ color:pct>=80?"#34d399":pct>=50?"#fbbf24":"#f87171", fontWeight:700, minWidth:30, fontSize:10 }}>{pct}%</span></div></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FF = ({l,children}) => <div style={{ marginBottom:12 }}><label style={{ display:"block", fontSize:9, color:"#64748b", marginBottom:4, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>{l}</label>{children}</div>;
const IS = (x={}) => ({ width:"100%", padding:"8px 10px", background:"#0a0e1a", border:"1px solid #1e2d4a", borderRadius:8, color:"#e2e8f0", fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...x });
const SS = (x={}) => ({ padding:"7px 10px", background:"#0a0e1a", border:"1px solid #1e2d4a", borderRadius:8, color:"#e2e8f0", fontSize:11, cursor:"pointer", outline:"none", fontFamily:"inherit", ...x });
