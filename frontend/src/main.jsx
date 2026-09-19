import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {MapContainer, TileLayer, CircleMarker, Popup} from "react-leaflet";
import {supabase, supabaseConfigured} from "./supabase";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

async function api(path, options={}) {
  const res = await fetch(`${API}/api${path}`, {
    headers: {"Content-Type":"application/json", ...(options.headers||{})},
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function Stat({label,value,alert=false}) {
  return <div className={`stat ${alert?"alert":""}`}><small>{label}</small><strong>{value}</strong></div>
}

function Dashboard({setPage}) {
  const [d,setD]=useState(null); const [roads,setRoads]=useState([]); const [vehicles,setVehicles]=useState([]);
  useEffect(()=>{Promise.all([api("/dashboard"),api("/roads"),api("/vehicles")]).then(([a,b,c])=>{setD(a);setRoads(b);setVehicles(c)})},[]);
  return <div>
    <div className="hero"><div><h1>NER Logistics Intelligence</h1><p>Real-time accessibility, risk and essential-supply visibility.</p></div>
      <button onClick={()=>setPage("emergency")}>Emergency Control</button>
    </div>
    <div className="stats">
      <Stat label="Open incidents" value={d?.open_incidents??"—"} alert/>
      <Stat label="Vehicles on route" value={d?.vehicles_on_route??"—"}/>
      <Stat label="Blocked roads" value={d?.blocked_roads??"—"} alert/>
      <Stat label="High-risk corridors" value={d?.high_risk_corridors??"—"} alert/>
    </div>
    <section className="panel map-panel">
      <div className="panel-head"><div><p className="section-kicker">REGIONAL OVERVIEW</p><h2>Live Accessibility Map</h2></div><span className="map-status"><i></i> Live feed</span></div>
      <MapContainer center={[25.7,91.5]} zoom={6} style={{height:"480px"}}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {roads.map(r=><CircleMarker key={r.id} center={[r.latitude,r.longitude]} radius={10} pathOptions={{color:r.risk_score>=65?"#ef4444":r.risk_score>=35?"#f59e0b":"#22c55e"}}>
          <Popup><b>{r.name}</b><br/>Status: {r.status}<br/>Risk: {r.risk_score}%</Popup>
        </CircleMarker>)}
        {vehicles.map(v=><CircleMarker key={"v"+v.id} center={[v.latitude,v.longitude]} radius={7} pathOptions={{color:"#2563eb"}}>
          <Popup>🚚 {v.vehicle_number}<br/>{v.status}<br/>Speed: {v.speed} km/h</Popup>
        </CircleMarker>)}
      </MapContainer>
    </section>
  </div>
}

function Incidents(){
  const [items,setItems]=useState([]); const [form,setForm]=useState({type:"LANDSLIDE",severity:"HIGH",latitude:"25.58",longitude:"91.89",description:""});
  const load=()=>api("/incidents").then(setItems); useEffect(load,[]);
  async function submit(e){e.preventDefault(); await api("/incidents",{method:"POST",body:JSON.stringify({...form,latitude:+form.latitude,longitude:+form.longitude})}); setForm({...form,description:""}); load();}
  return <div><div className="page-heading"><div><p className="section-kicker">FIELD OPERATIONS</p><h1>Incident reporting</h1><p>Capture road disruption signals directly from the field.</p></div><span className="page-mark">01</span></div><div className="grid2"><form className="panel form" onSubmit={submit}>
    <label>Incident type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>LANDSLIDE</option><option>FLOOD</option><option>ROAD_DAMAGE</option><option>BRIDGE_DAMAGE</option><option>TRAFFIC</option></select></label>
    <label>Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
    <label>Latitude<input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label>
    <label>Longitude<input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label>
    <label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <button>Submit Geo-tagged Incident</button>
  </form><div className="panel"><h2>Recent incidents</h2>{items.map(x=><div className="list" key={x.id}><b>{x.type}</b> <span className="badge">{x.severity}</span><br/>{x.description}<small>{new Date(x.timestamp).toLocaleString()}</small></div>)}</div></div></div>
}

function Vehicles(){
  const [items,setItems]=useState([]); useEffect(()=>{api("/vehicles").then(setItems)},[]);
  return <div><div className="page-heading"><div><p className="section-kicker">FLEET CONTROL</p><h1>Vehicle tracking</h1><p>Keep every vehicle, driver, and signal in view.</p></div><span className="page-mark">02</span></div><div className="cards">{items.map(v=><div className="panel vehicle-card" key={v.id}><div className="vehicle-top"><h2>🚚 {v.vehicle_number}</h2><span className="status-pill">{v.status}</span></div><p>Driver ID: {v.driver_id ?? "Unassigned"}</p><p>GPS: {v.latitude?.toFixed(4) ?? "—"}, {v.longitude?.toFixed(4) ?? "—"}</p><div className="vehicle-speed"><strong>{v.speed ?? 0}</strong><span>km/h current speed</span></div></div>)}</div></div>
}

function AI(){
  const [f,setF]=useState({rainfall:120,previous_rainfall:160,slope:30,elevation:1000,road_condition:4,traffic:4,river_level:4,historical_incidents:5});
  const [result,setResult]=useState(null);
  const run=()=>api("/ai/risk",{method:"POST",body:JSON.stringify(f)}).then(setResult);
  return <div><div className="page-heading"><div><p className="section-kicker">DECISION SUPPORT</p><h1>Route risk analytics</h1><p>Model disruption probability from environmental and operational signals.</p></div><span className="page-mark">03</span></div><div className="grid2"><div className="panel form"><div className="panel-title"><h2>Risk inputs</h2><span>8 signals</span></div>{Object.entries(f).map(([k,v])=><label key={k}>{k.replaceAll("_"," ")}<input type="number" value={v} onChange={e=>setF({...f,[k]:+e.target.value})}/></label>)}<button onClick={run}>Predict route risk</button></div><div className="panel result"><p className="section-kicker">MODEL OUTPUT</p><h2>Prediction</h2>{result?<><div className="risk">{result.risk_probability}%</div><h2>{result.risk_level} risk</h2><p>Prototype signal based on the current route conditions.</p></>:<p>Enter the route conditions, then run the model.</p>}</div></div></div>
}

function Deliveries(){
  const [items,setItems]=useState([]); const [form,setForm]=useState({vehicle_id:1,cargo_type:"MEDICINES",origin:"Guwahati",destination:"Remote District",priority:"CRITICAL"});
  const load=()=>api("/deliveries").then(setItems); useEffect(load,[]);
  async function submit(e){e.preventDefault(); await api("/deliveries",{method:"POST",body:JSON.stringify({...form,vehicle_id:+form.vehicle_id})});load();}
  return <div><div className="page-heading"><div><p className="section-kicker">LAST-MILE OPERATIONS</p><h1>Essential deliveries</h1><p>Coordinate priority cargo from origin to destination.</p></div><span className="page-mark">04</span></div><div className="grid2"><form className="panel form" onSubmit={submit}>
    <label>Vehicle ID<input type="number" value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})}/></label>
    <label>Cargo<select value={form.cargo_type} onChange={e=>setForm({...form,cargo_type:e.target.value})}><option>MEDICINES</option><option>FOOD</option><option>AGRICULTURAL_PRODUCE</option><option>CONSTRUCTION_MATERIAL</option></select></label>
    <label>Origin<input value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})}/></label>
    <label>Destination<input value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})}/></label>
    <label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>CRITICAL</option><option>HIGH</option><option>NORMAL</option></select></label>
    <button>Create Delivery</button></form>
    <div className="panel"><h2>Delivery board</h2>{items.map(x=><div className="list" key={x.id}><b>#{x.id} {x.cargo_type}</b> <span className="badge">{x.priority}</span><br/>{x.origin} → {x.destination}<br/>ETA: {x.eta} min</div>)}</div>
  </div></div>
}

function Emergency(){
  const [active,setActive]=useState(false);
  const toggle=()=>api("/emergency/toggle",{method:"POST"}).then(x=>setActive(x.emergency_mode));
  return <div><div className="page-heading"><div><p className="section-kicker">RESPONSE CENTER</p><h1>Emergency operations</h1><p>Coordinate critical action when routes and communities are under pressure.</p></div><span className="page-mark">05</span></div><div className={`emergency ${active?"active":""}`}><h1>🚨 {active?"Emergency mode active":"Emergency mode is off"}</h1><p>{active?"Prioritize medical and food deliveries and monitor high-risk corridors.":"Activate the response mode to bring critical routes and supplies to the front of the queue."}</p><button onClick={toggle}>{active?"Deactivate":"Activate"} emergency mode</button></div><div className="panel playbook"><div className="panel-title"><h2>Emergency playbook</h2><span>5 actions</span></div><ol><li>Verify field incidents and road closures.</li><li>Prioritize medicines, food and rescue supplies.</li><li>Recalculate affected delivery routes.</li><li>Publish multilingual alerts through approved channels.</li><li>Keep an auditable incident and decision log.</li></ol></div></div>
}

function Login({onLogin}){
  const [role,setRole]=useState("admin");
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault(); setBusy(true); setError(""); try{if(!supabaseConfigured){if(role==="admin"&&identifier==="Anish"&&password==="AnishSah123!"){onLogin({role,name:"Anish",email:"admin@ner.local"});return;} throw new Error("Use the assigned workspace credentials.");} const {data,error:authError}=await supabase.auth.signInWithPassword({email:identifier,password}); if(authError) throw authError; onLogin({role,name:data.user.user_metadata?.full_name||data.user.email,email:data.user.email,id:data.user.id});}catch(err){setError(err.message||"Unable to sign in");}finally{setBusy(false)}}
  async function google(){setError(""); if(!supabaseConfigured){setError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google sign-in."); return;} localStorage.setItem("smartlogix_pending_role",role); const {data,error:authError}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:SITE_URL,skipBrowserRedirect:true}}); if(authError){setError(authError.message.includes("provider is not enabled")?"Google sign-in is not enabled for this Supabase project yet.":authError.message); return;} if(data?.url) window.location.assign(data.url)}
  return <div className="login-shell"><div className="login-art"><div className="login-brand">NER <span>SMARTLOGIX</span></div><div><p className="eyebrow">NORTH EASTERN REGION</p><h1>Move what matters.<br/><em>Know what changes.</em></h1><p className="login-copy">One intelligent command center for resilient roads, safer fleets, and essential deliveries.</p></div><div className="login-signal"><span>●</span> Network intelligence online <b>↗</b></div></div><div className="login-card"><div className="login-card-top"><span className="mini-mark">NS</span><span>Secure workspace</span></div><h2>Welcome back</h2><p className="muted">Sign in to your SmartLogix workspace.</p><div className="role-switch">{[["admin","Admin","Operations"],["customer","Customer","Track a parcel"],["driver","Delivery staff","Your route"]].map(([id,label,sub])=><button type="button" className={role===id?"role-option selected":"role-option"} onClick={()=>setRole(id)} key={id}><strong>{label}</strong><small>{sub}</small></button>)}</div><button className="google-button" type="button" onClick={google}><span className="google-g">G</span> Continue with Google</button><div className="or-divider"><span>or use credentials</span></div><form className="login-form" onSubmit={submit}><label>Username or email<input type="text" placeholder={role==="admin"?"Anish":"name@example.com"} value={identifier} onChange={e=>setIdentifier(e.target.value)} required/></label><label>Password<div className="password-wrap"><input type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><span>⌁</span></div></label><div className="login-meta"><label className="remember"><input type="checkbox"/> Remember me</label><a href="#reset">Forgot password?</a></div>{error&&<p className="auth-error">{error}</p>}<button className="login-submit" disabled={busy}>{busy?"Signing in…":"Enter workspace"} <span>→</span></button></form><p className="login-note">Protected operations environment · Supabase Auth</p></div></div>
}

function CustomerPortal({user,onLogout}){
  const [items,setItems]=useState([]); const [selected,setSelected]=useState(null);
  useEffect(()=>{api("/deliveries").then(data=>{setItems(data);setSelected(data[0]||null)})},[]);
  return <div className="portal"><PortalHeader user={user} onLogout={onLogout}/><div className="portal-content"><div className="portal-intro"><div><p className="eyebrow blue">CUSTOMER PORTAL</p><h1>Your deliveries, in sight.</h1><p>Follow every handoff from origin to doorstep.</p></div><button className="ghost-button">＋ New delivery</button></div><div className="tracking-grid"><section className="tracking-list panel"><div className="section-heading"><h2>Active parcels</h2><span>{items.length} tracked</span></div>{items.map(item=><button className={selected?.id===item.id?"parcel-row selected":"parcel-row"} key={item.id} onClick={()=>setSelected(item)}><span className="parcel-icon">□</span><span><b>{item.cargo_type}</b><small>#{String(item.id).padStart(4,"0")} · {item.origin}</small></span><span className="status-dot">{item.status}</span></button>)}{!items.length&&<p className="muted">No active deliveries yet.</p>}</section><section className="tracking-detail panel"><div className="detail-top"><div><span className="badge blue-badge">IN TRANSIT</span><h2>{selected?.cargo_type||"Your parcel"}</h2><p>Delivery #{selected?.id?String(selected.id).padStart(4,"0"):"----"}</p></div><strong className="eta-number">{selected?.eta||"—"}<small>min ETA</small></strong></div><div className="route-line"><span className="route-point start"></span><div><b>{selected?.origin||"Origin"}</b><small>Parcel collected</small></div><i></i><span className="route-point end"></span><div><b>{selected?.destination||"Destination"}</b><small>Estimated arrival</small></div></div><div className="customer-map"><div className="map-road road-a"></div><div className="map-road road-b"></div><span className="map-pin pin-a">●</span><span className="map-pin pin-b">●</span><span className="map-truck">▰</span></div><div className="detail-footer"><span>Last update <b>Just now</b></span><button className="text-button">View delivery details →</button></div></section></div></div></div>
}

function DriverPortal({user,onLogout}){
  const [items,setItems]=useState([]); const [location,setLocation]=useState(null); const [message,setMessage]=useState("");
  useEffect(()=>{api("/deliveries").then(setItems)},[]);
  function shareLocation(){navigator.geolocation?.getCurrentPosition(async pos=>{try{await api("/vehicles/1/location",{method:"POST",body:JSON.stringify({latitude:pos.coords.latitude,longitude:pos.coords.longitude,speed:pos.coords.speed||0})});setLocation(pos.coords);setMessage("Location shared just now")}catch{setMessage("Could not share location")}},()=>setMessage("Location permission is needed"));}
  return <div className="portal"><PortalHeader user={user} onLogout={onLogout}/><div className="portal-content"><div className="portal-intro"><div><p className="eyebrow blue">DELIVERY CONSOLE</p><h1>Good morning, driver.</h1><p>Keep your route visible and every handoff accounted for.</p></div><button className="location-button" onClick={shareLocation}>⌖ Share live location</button></div><div className="driver-grid"><section className="driver-route panel"><div className="section-heading"><div><h2>Today's route</h2><span>Vehicle NER-101 · Medical Van</span></div><span className="live-chip"><i></i> LIVE</span></div><div className="driver-map"><div className="map-road road-a"></div><div className="map-road road-b"></div><span className="map-pin pin-a">●</span><span className="map-pin pin-b">●</span><span className="map-truck">▰</span><div className="map-label label-a">Guwahati</div><div className="map-label label-b">Remote District</div></div><div className="location-status">{message||"Your location is ready to share with dispatch."}</div></section><section className="driver-stops panel"><div className="section-heading"><h2>Assigned parcels</h2><span>{items.length} stops</span></div>{items.map((item,index)=><div className="stop-row" key={item.id}><span className="stop-number">0{index+1}</span><div><b>{item.cargo_type}</b><small>{item.destination} · {item.priority}</small></div><span className="stop-state">{item.status}</span></div>)}{!items.length&&<p className="muted">No parcels assigned.</p>}</section></div></div></div>
}

function PortalHeader({user,onLogout}){return <header className="portal-header"><div className="header-brand">NER <span>SMARTLOGIX</span></div><div className="header-actions"><button className="icon-button">♧</button><span className="user-role"><b>{user.name|| (user.role==="admin"?"Admin":user.role==="driver"?"Delivery staff":"Customer")}</b><small>{user.email}</small></span><button className="logout-button" onClick={onLogout}>Sign out</button></div></header>}

function AdminWorkspace({user,onLogout}){
  const [page,setPage]=useState("dashboard");
  const pages={dashboard:<Dashboard setPage={setPage}/>,incidents:<Incidents/>,vehicles:<Vehicles/>,deliveries:<Deliveries/>,ai:<AI/>,emergency:<Emergency/>};
  return <div className="app"><aside><div className="brand">NER<br/><span>SmartLogix</span></div>{[["dashboard","Dashboard"],["incidents","Incidents"],["vehicles","Vehicles"],["deliveries","Routes & parcels"],["ai","Analytics"],["emergency","Emergency"]].map(([id,n])=><button className={page===id?"nav active":"nav"} onClick={()=>setPage(id)} key={id}>{n}</button>)}<div className="offline">● System online<br/><small>Live operations feed</small></div></aside><main><div className="workspace-bar"><span>Operations workspace</span><span>🔔 &nbsp;{user.name||"Admin"} <button onClick={onLogout}>Sign out</button></span></div>{pages[page]}</main></div>
}

function App(){
  const [user,setUser]=useState(null); const [authReady,setAuthReady]=useState(!supabaseConfigured);
  function login(next){localStorage.setItem("smartlogix_user",JSON.stringify(next));setUser(next)}
  function logout(){localStorage.removeItem("smartlogix_user"); if(supabaseConfigured) supabase.auth.signOut(); setUser(null)}
  useEffect(()=>{if(!supabaseConfigured){try{setUser(JSON.parse(localStorage.getItem("smartlogix_user")))}catch{} return;} supabase.auth.getSession().then(({data})=>{if(data.session){const authUser=data.session.user; const fallback=localStorage.getItem("smartlogix_pending_role")||"customer"; login({id:authUser.id,email:authUser.email,role:authUser.user_metadata?.role||fallback}); localStorage.removeItem("smartlogix_pending_role")} setAuthReady(true)}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(!session){setUser(null);return;} const authUser=session.user; const fallback=localStorage.getItem("smartlogix_pending_role")||"customer"; login({id:authUser.id,email:authUser.email,role:authUser.user_metadata?.role||fallback})}); return ()=>subscription.unsubscribe()},[]);
  if(!authReady) return <div className="auth-loading"><span></span>Connecting to secure workspace…</div>;
  if(!user) return <Login onLogin={login}/>;
  if(user.role==="customer") return <CustomerPortal user={user} onLogout={logout}/>;
  if(user.role==="driver") return <DriverPortal user={user} onLogout={logout}/>;
  return <AdminWorkspace user={user} onLogout={logout}/>;
}
createRoot(document.getElementById("root")).render(<App/>);
