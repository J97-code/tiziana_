import React, { useEffect, useMemo, useRef, useState } from 'react'

/** 78 cartas: generadas (Mayores + Menores) */
function buildTarot() {
  const majors = [
    ["0","El Loco","Nuevos comienzos; fe. Invertida: imprudencia."],
    ["I","El Mago","Voluntad y acción. Invertida: manipulación."],
    ["II","La Sacerdotisa","Intuición; misterio. Invertida: bloqueo interno."],
    ["III","La Emperatriz","Abundancia; cuidado. Invertida: estancamiento."],
    ["IV","El Emperador","Estructura; liderazgo. Invertida: rigidez."],
    ["V","El Hierofante","Tradición; aprendizaje. Invertida: no conformismo."],
    ["VI","Los Enamorados","Elección; unión. Invertida: desalineación."],
    ["VII","El Carro","Dirección; victoria. Invertida: dispersión."],
    ["VIII","La Fuerza","Coraje; compasión. Invertida: inseguridad."],
    ["IX","El Ermitaño","Búsqueda interior. Invertida: aislamiento."],
    ["X","La Rueda de la Fortuna","Ciclos; cambio. Invertida: resistencia."],
    ["XI","La Justicia","Equilibrio; verdad. Invertida: sesgo."],
    ["XII","El Colgado","Nueva perspectiva. Invertida: estancamiento."],
    ["XIII","La Muerte","Transformación; cierre. Invertida: apego."],
    ["XIV","La Templanza","Armonía; moderación. Invertida: exceso."],
    ["XV","El Diablo","Apegos; sombras. Invertida: liberación."],
    ["XVI","La Torre","Ruptura; revelación. Invertida: negación."],
    ["XVII","La Estrella","Esperanza; sanación. Invertida: duda."],
    ["XVIII","La Luna","Inconsciente; sueños. Invertida: confusión."],
    ["XIX","El Sol","Alegría; claridad. Invertida: vitalidad baja."],
    ["XX","El Juicio","Despertar; evaluación. Invertida: autojuicio."],
    ["XXI","El Mundo","Culminación; totalidad. Invertida: ciclo abierto."]
  ];
  const suits = [["Bastos","energía, acción"],["Copas","emociones, vínculos"],["Espadas","mente, conflicto"],["Oros","materia, trabajo"]];
  const ranks = [["As","semilla; potencial"],["Dos","pareja; dualidad"],["Tres","crecimiento; colaboración"],["Cuatro","estabilidad; pausa"],["Cinco","tensión; cambio"],["Seis","armonía; avance"],["Siete","evaluación; fe"],["Ocho","progreso; disciplina"],["Nueve","culminación; prueba"],["Diez","cierre; legado"],["Sota","aprendizaje; mensaje"],["Caballo","movimiento; búsqueda"],["Reina","madurez; cuidado"],["Rey","maestría; dirección"]];

  const TAROT = [];
  majors.forEach(([num,name,mean])=>{
    const id = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'');
    TAROT.push({id, grupo:'Mayor', nombre:`${num} - ${name}`, significado:mean});
  });
  suits.forEach(([suit,sMean])=>{
    ranks.forEach(([rank,rMean])=>{
      const id=(rank+'-'+suit).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'-');
      TAROT.push({id, grupo:'Menor', nombre:`${rank} de ${suit}`, significado:`${rMean}. (${suit}: ${sMean}). Invertida: sombra de estos temas.`});
    });
  });
  return TAROT;
}

/** genera un SVG card estilizado como "imagen" */
function svgCard(name) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a78bfa"/>
        <stop offset="1" stop-color="#f472b6"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="1080" fill="#141325"/>
    <rect x="12" y="12" width="696" height="1056" rx="36" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
    <circle cx="120" cy="140" r="10" fill="white"/><circle cx="200" cy="260" r="3" fill="white"/><circle cx="600" cy="220" r="4" fill="white"/>
    <rect x="60" y="920" width="600" height="80" rx="18" fill="url(#g)"/>
    <text x="360" y="970" font-family="system-ui, -apple-system" font-size="40" font-weight="700" text-anchor="middle" fill="#141325">${esc(name)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** downscale image/blob->vector (grayscale) */
async function imgToVec(urlOrBlob){
  return await new Promise((resolve)=>{
    const img = new Image(); img.crossOrigin='anonymous'
    img.onload = ()=>{
      const s = 32; const c = document.createElement('canvas'); c.width = s; c.height = s;
      const ctx = c.getContext('2d'); ctx.drawImage(img,0,0,s,s);
      const { data } = ctx.getImageData(0,0,s,s); const v=[];
      for(let i=0;i<data.length;i+=4){ v.push((data[i]+data[i+1]+data[i+2])/3) }
      resolve(v);
    };
    if(urlOrBlob instanceof Blob) img.src = URL.createObjectURL(urlOrBlob); else img.src = urlOrBlob;
  });
}
const dist = (a,b)=>{ let s=0; for(let i=0;i<a.length;i++){ const d=a[i]-b[i]; s+=d*d } return Math.sqrt(s) };

function ThemeSwitch({ theme, setTheme }){
  const apply = (t)=>{ setTheme(t); document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t) }
  return (
    <div className="theme-switch">
      {['violeta','oro','oscuro'].map(t => (
        <button key={t} className={theme===t?'active':''} onClick={()=>apply(t)}>{t}</button>
      ))}
    </div>
  )
}

function Nav({ tab, setTab, theme, setTheme }){
  return (
    <div className="card" style={{margin:'8px 0', padding: 8}}>
      <div className="nav">
        <a href="#" className={tab==='scan'?'active':''} onClick={(e)=>{e.preventDefault();setTab('scan')}}>Escanear</a>
        <a href="#" className={tab==='lecturas'?'active':''} onClick={(e)=>{e.preventDefault();setTab('lecturas')}}>Lecturas guiadas</a>
        <a href="#" className={tab==='biblioteca'?'active':''} onClick={(e)=>{e.preventDefault();setTab('biblioteca')}}>Cartas</a>
        <a href="#" className={tab==='historial'?'active':''} onClick={(e)=>{e.preventDefault();setTab('historial')}}>Historial</a>
        <ThemeSwitch theme={theme} setTheme={setTheme} />
      </div>
    </div>
  )
}

function useThumbIndex(TAROT){
  const [index, setIndex] = useState(null)
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      const out = [];
      for(const c of TAROT){
        const vec = await imgToVec(svgCard(c.nombre));
        out.push([c.id, vec]);
      }
      if(!cancelled) setIndex(out);
    })();
    return ()=>{cancelled=true}
  }, [TAROT]);
  return index;
}

function CameraScanner({ onRecognized, onSnapshot }){
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(()=>{
    let stream;
    (async()=>{
      try{
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if(videoRef.current){ videoRef.current.srcObject = stream; await videoRef.current.play(); setReady(true) }
      }catch(err){ setError('No se pudo abrir la cámara. Activa permisos en Ajustes > Safari.') }
    })();
    return ()=>{ if(stream){ stream.getTracks().forEach(t=>t.stop()) } }
  }, [])
  const takePhoto = () => {
    const v=videoRef.current, c=canvasRef.current;
    if(!v||!c) return;
    c.width=v.videoWidth; c.height=v.videoHeight;
    const ctx=c.getContext('2d'); ctx.drawImage(v,0,0,c.width,c.height);
    c.toBlob(async (blob)=>{ onSnapshot && onSnapshot(blob); onRecognized && onRecognized(blob) }, 'image/jpeg', 0.9)
  }
  return (
    <div className="card">
      <div className="title">Escanear carta</div>
      <p className="subtitle">Captura la carta y el sistema intentará reconocerla automáticamente (MVP por similitud visual).</p>
      {error && <p className="muted">{error}</p>}
      <div style={{display:'grid', gap:12}}>
        <video ref={videoRef} playsInline muted style={{width:'100%', borderRadius:16, border:'1px solid rgba(255,255,255,.2)'}} />
        <button className="btn" onClick={takePhoto} disabled={!ready}>Capturar</button>
        <canvas ref={canvasRef} style={{display:'none'}} />
      </div>
    </div>
  )
}

function RecognitionResult({ blob, guess, setGuess, TAROT }){
  const card = TAROT.find(c=>c.id===guess)
  return (
    <div className="card">
      <div className="two">
        <div>
          {blob ? <img className="img-card" src={URL.createObjectURL(blob)} alt="captura" /> : <div className="muted">Sin imagen capturada.</div>}
        </div>
        <div>
          <div className="title">Carta detectada (editable)</div>
          <select className="select" value={guess||''} onChange={e=>setGuess(e.target.value)}>
            <option value="">-- Elige manualmente si es necesario --</option>
            {TAROT.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {card && (
            <div style={{marginTop:12}}>
              <img className="img-card" src={svgCard(card.nombre)} alt={card.nombre} />
              <h3 className="title" style={{marginTop:12}}>{card.nombre}</h3>
              <p className="subtitle">{card.significado}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Lecturas({ TAROT }){
  const [spreadKey, setSpreadKey] = useState('tres')
  const [seleccion, setSeleccion] = useState({})
  const spreads = {
    "tres": { nombre: "3 Cartas (Pasado/Presente/Futuro)", posiciones: [
      {id:1,titulo:"Pasado",desc:"Contexto y orígenes"},
      {id:2,titulo:"Presente",desc:"Energía actual"},
      {id:3,titulo:"Futuro",desc:"Dirección probable"}
    ]},
    "cruz-celta": { nombre: "Cruz Celta (10)", posiciones: [
      {id:1,titulo:"Situación",desc:"Tema central"},
      {id:2,titulo:"Reto",desc:"Lo que cruza"},
      {id:3,titulo:"Base",desc:"Fundamento"},
      {id:4,titulo:"Pasado",desc:"Influencia reciente"},
      {id:5,titulo:"Meta",desc:"Ideal consciente"},
      {id:6,titulo:"Futuro",desc:"Próximo paso"},
      {id:7,titulo:"Tú",desc:"Tu papel"},
      {id:8,titulo:"Entorno",desc:"Influencias externas"},
      {id:9,titulo:"Miedos/Deseos",desc:"Bloqueos o anhelos"},
      {id:10,titulo:"Resultado",desc:"Probable desenlace"}
    ]},
    "decision-ab": { nombre: "Decisión A/B (6)", posiciones: [
      {id:1,titulo:"Tema",desc:"Lo que decides"},
      {id:2,titulo:"Pros A",desc:"Ventajas"},
      {id:3,titulo:"Contras A",desc:"Riesgos"},
      {id:4,titulo:"Pros B",desc:"Ventajas"},
      {id:5,titulo:"Contras B",desc:"Riesgos"},
      {id:6,titulo:"Consejo",desc:"Dirección sabia"}
    ]}
  };
  const sp = spreads[spreadKey];
  const setPos = (id, cardId)=> setSeleccion(s=>({...s, [id]: cardId}))
  const clear = ()=> setSeleccion({})
  const save = ()=>{ const entry = { id: Date.now(), spread: spreadKey, seleccion, fecha: new Date().toISOString() }; const hist = JSON.parse(localStorage.getItem('historial')||'[]'); hist.unshift(entry); localStorage.setItem('historial', JSON.stringify(hist)); alert('Lectura guardada en historial') }
  return (
    <div className="grid">
      <div className="card">
        <div className="title">Lecturas guiadas</div>
        <p className="subtitle">Elige una tirada y asigna cartas a cada posición. Puedes guardar el resultado.</p>
        <div className="row">
          <select className="select" value={spreadKey} onChange={e=>setSpreadKey(e.target.value)}>
            {Object.keys(spreads).map(k=> <option key={k} value={k}>{spreads[k].nombre}</option>)}
          </select>
          <button className="btn secondary" onClick={clear}>Reiniciar</button>
          <button className="btn" onClick={save}>Guardar en historial</button>
        </div>
      </div>
      <div className="card">
        <div className="title">{sp.nombre}</div>
        <div className="row">
          {sp.posiciones.map(p=> (
            <div key={p.id} style={{display:'grid', gap:8}}>
              <div className="reading-card">
                {seleccion[p.id]
                  ? <img src={svgCard(TAROT.find(c=>c.id===seleccion[p.id])?.nombre||'Carta')} alt="carta" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:10}}/>
                  : p.id}
              </div>
              <div style={{fontWeight:700}}>{p.titulo}</div>
              <div className="muted" style={{fontSize:12}}>{p.desc}</div>
              <select className="select" value={seleccion[p.id]||''} onChange={e=>setPos(p.id, e.target.value)}>
                <option value="">-- Elegir carta --</option>
                {TAROT.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Biblioteca({ TAROT }){
  const grupos = useMemo(()=>({
    'Mayor': TAROT.filter(c=>c.grupo==='Mayor'),
    'Menor': TAROT.filter(c=>c.grupo==='Menor'),
  }), [TAROT])
  return (
    <div className="grid">
      {Object.entries(grupos).map(([g, list]) => (
        <div className="card" key={g}>
          <div className="title">{g} Arcano</div>
          {list.map(c => (
            <div key={c.id} style={{display:'grid', gridTemplateColumns:'72px 1fr', gap:12, alignItems:'center', margin:'10px 0'}}>
              <img src={svgCard(c.nombre)} alt={c.nombre} style={{width:72, height:108, borderRadius:8, border:'1px solid rgba(255,255,255,.2)'}}/>
              <div>
                <div style={{fontWeight:600}}>{c.nombre}</div>
                <div className="muted" style={{fontSize:14}}>{c.significado}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function Historial({ TAROT }){
  const [items, setItems] = useState(()=> JSON.parse(localStorage.getItem('historial')||'[]'))
  const clear = ()=>{ localStorage.removeItem('historial'); setItems([]) }
  const nameById = (id)=> (TAROT.find(c=>c.id===id)?.nombre || 'Carta')

  return (
    <div className="grid">
      <div className="card">
        <div className="title">Historial de tiradas</div>
        <div className="row"><button className="btn secondary" onClick={clear}>Borrar historial</button></div>
      </div>
      {items.length===0 ? (
        <div className="card"><div className="subtitle">No hay tiradas guardadas aún.</div></div>
      ) : items.map(e => (
        <div className="card history-item" key={e.id}>
          <div className="subtitle">{new Date(e.fecha).toLocaleString()}</div>
          <div><strong>Tirada:</strong> {e.spread}</div>
          <div className="row">
            {Object.entries(e.seleccion).map(([pos, cid])=> (
              <div key={pos} style={{display:'grid', gap:6}}>
                <img src={svgCard(nameById(cid))} style={{width:72, height:108, borderRadius:8, border:'1px solid rgba(255,255,255,.2)'}}/>
                <div className="muted" style={{fontSize:12}}>Pos {pos}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App({ defaultTheme='violeta' }){
  const TAROT = useMemo(buildTarot, [])        // ✅ build once
  const [tab, setTab] = useState('scan')
  const [theme, setTheme] = useState(defaultTheme)
  const [blob, setBlob] = useState(null)
  const [guess, setGuess] = useState('')
  const index = useThumbIndex(TAROT)

  async function handleRecognize(newBlob){
    setBlob(newBlob)
    if(!newBlob || !index) return
    const vec = await imgToVec(newBlob)
    let best = [null, Infinity]
    for(const [id, v] of index){ 
      let s=0; for(let i=0;i<v.length;i++){ const d=vec[i]-v[i]; s+=d*d }
      const d = Math.sqrt(s)
      if(d < best[1]) best = [id, d]
    }
    setGuess(best[0])
  }

  return (
    <div className="frame">
      <header className="header">
        <div className="brand">
          <div className="badge">☾</div>
          <div>
            <div style={{fontWeight:700}}>Tarot Ultra</div>
            <div className="subtitle">Escáner automático • Lecturas guiadas • Biblioteca completa</div>
          </div>
        </div>
        <Nav tab={tab} setTab={setTab} theme={theme} setTheme={setTheme} />
      </header>

      <main className="grid">
        {tab==='scan' && (<>
          <CameraScanner onRecognized={handleRecognize} onSnapshot={setBlob} />
          <RecognitionResult blob={blob} guess={guess} setGuess={setGuess} TAROT={TAROT} />
        </>)}
        {tab==='lecturas' && (<Lecturas TAROT={TAROT} />)}
        {tab==='biblioteca' && (<Biblioteca TAROT={TAROT} />)}
        {tab==='historial' && (<Historial TAROT={TAROT} />)}
      </main>

      <footer className="frame muted">PWA para iPhone: Safari → Compartir → “Añadir a pantalla de inicio”.</footer>
    </div>
  )
}
