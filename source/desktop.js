  // Injected inside app.js so the window manager shares the existing document state.
  const WINDOW_META={document:{title:'Weekend event proposal',file:'Weekend event.docx',app:'Pages',sprite:'book_closed',icon:'file-doc'},reference:{title:'Venue notes & quote',file:'Venue notes.docx',app:'Mail',sprite:'envelope',icon:'envelope-simple'},table:{title:'Event checklist',file:'Event checklist.xlsx',app:'Sheets',sprite:'book_left',icon:'file-xls'},board:{title:'Mistport · worldbuilding',file:'Mistport.board',app:'Canvas',sprite:'seal',icon:'squares-four'}};
  let desktopZ=40,windowGesture=null;
  function desktopSize(){const r=$('#workspace').getBoundingClientRect();return {w:r.width||innerWidth,h:r.height||innerHeight-48};}
  function initialWindows(){const {w,h}=desktopSize(),left=w<900?24:Math.round(w*.035),docWidth=Math.min(620,Math.max(480,w*.50));return {
    document:{x:left,y:42,w:Math.min(docWidth,w-100),h:Math.min(710,h-145),z:30,minimized:false,closed:false,maximized:false},
    reference:{x:Math.max(200,w*.58),y:62,w:Math.min(420,w-225),h:Math.min(340,h*.42),z:12,minimized:false,closed:false,maximized:false},
    table:{x:Math.max(160,w*.55),y:Math.max(210,h*.46),w:Math.min(480,w-175),h:Math.min(360,h*.42),z:20,minimized:false,closed:false,maximized:false},
    board:{x:Math.max(95,w*.16),y:80,w:Math.min(780,w-125),h:Math.min(620,h-160),z:10,minimized:true,closed:false,maximized:false}
  };}
  function initializeDesktop(){
    if(!Array.isArray(state.refs))state.refs=clone(DEFAULT.refs);
    const first=!state.desktop?.windows;
    state.desktop=first?{windows:initialWindows()}:state.desktop;
    for(const [app,defaults]of Object.entries(initialWindows()))state.desktop.windows[app]={...defaults,...state.desktop.windows[app]};
    if(first){state.app='document';state.desktop.windows.document.z=40;}
    desktopZ=Math.max(40,...Object.values(state.desktop.windows).map(win=>Number(win.z)||10));
  }
  function windowContent(app){
    if(app==='document')return `<div class="window-body"><article class="document-sheet"><span class="doc-category">WEEKEND AT THE BOOKSTORE</span><h1>A little light for the weekend</h1><div class="doc-subtitle">Nightjar Books · event draft / still taking shape</div>${state.docs.map(d=>`<section class="editable-block" data-region="${esc(d.id)}"><h2>${esc(d.title)}</h2><div contenteditable="true" role="textbox" aria-label="Edit ${esc(d.title)}" data-edit="doc" data-id="${esc(d.id)}" spellcheck="false">${esc(d.text)}</div></section>`).join('')}<div class="doc-footnote">Select a passage, then secondary-click for a little magic.</div></article></div>`;
    if(app==='reference')return `<div class="window-body"><article class="reference-sheet"><span class="doc-category">NOTES FROM THE VENUE</span><h1>Venue notes & quote</h1><p class="reference-subtitle">References for the event · click any note to edit</p>${state.refs.map(r=>`<section class="editable-block" data-region="${esc(r.id)}"><h2>${esc(r.title)}</h2><div contenteditable="true" role="textbox" aria-label="Edit reference · ${esc(r.title)}" data-edit="ref" data-id="${esc(r.id)}" spellcheck="false">${esc(r.text)}</div></section>`).join('')}</article></div>`;
    if(app==='table')return `<div class="window-body"><article class="table-sheet"><span class="doc-category">ONE SMALL THING AT A TIME</span><h1>Event checklist</h1><p>Nightjar Books / click a cell to edit</p><table class="task-table"><thead><tr><th>Task</th><th>Owner</th><th>When</th><th>Status</th></tr></thead><tbody>${state.rows.map((row,i)=>`<tr data-region="row-${i}">${row.map((cell,j)=>`<td contenteditable="true" role="textbox" aria-label="Row ${i+1} ${['task','owner','date','Status'][j]}" data-edit="cell" data-row="${i}" data-col="${j}" spellcheck="false">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table><button id="add-row" class="table-add">＋ Add a task</button></article></div>`;
    return `<div class="window-body"><div class="board-surface"><div class="board-title">THOUGHTS, STILL GROWING<strong>A few threads of Mistport</strong></div><p class="board-instruction">Shift-click two notes, then pause for a proposal.</p><div class="board-grid">${state.notes.map(n=>`<article class="board-note${ui.selected.has(n.id)?' selected':''}" data-note="${esc(n.id)}" data-region="${esc(n.id)}" style="--dx:${Number(n.dx)||0}px;--dy:${Number(n.dy)||0}px"><h2>${esc(n.title)}</h2><p contenteditable="true" role="textbox" aria-label="Edit ${esc(n.title)}" data-edit="note" data-id="${esc(n.id)}" spellcheck="false">${esc(n.text)}</p><small>${ui.selected.has(n.id)?'Selected · you decide the connection':'A story still taking shape'}</small></article>`).join('')}</div>${state.link?`<div class="board-link">${esc(state.link)}</div>`:''}</div></div>`;
  }
  function fitWindow(app){const win=state.desktop.windows[app],{w,h}=desktopSize();win.w=clamp(Number(win.w)||500,Math.min(320,w-24),w-24);win.h=clamp(Number(win.h)||400,Math.min(220,h-115),h-100);win.x=clamp(Number(win.x)||12,8,Math.max(8,w-win.w-12));win.y=clamp(Number(win.y)||30,12,Math.max(12,h-win.h-86));}
  function applyWindow(app){
    const el=$(`[data-window="${app}"]`),win=state.desktop.windows[app];if(!el)return;
    if(!win.maximized)fitWindow(app);const {w,h}=desktopSize();
    el.hidden=!!(win.closed||win.minimized);el.classList.toggle('focused',state.app===app&&!el.hidden);el.classList.toggle('maximized',!!win.maximized);
    el.style.left=(win.maximized?12:win.x)+'px';el.style.top=(win.maximized?12:win.y)+'px';el.style.width=(win.maximized?w-24:win.w)+'px';el.style.height=(win.maximized?h-108:win.h)+'px';el.style.zIndex=win.z;
    const zoom=el.querySelector('[data-window-action="maximize"]');zoom.setAttribute('aria-label',(win.maximized?'Restore':'Maximize')+' '+WINDOW_META[app].title);zoom.title=win.maximized?'Restore window':'Maximize window';
  }
  function refreshDock(){
    $$('[data-app]').forEach(b=>{const app=b.dataset.app,win=state.desktop.windows[app];b.setAttribute('aria-pressed',String(state.app===app&&!win.closed&&!win.minimized));b.classList.toggle('is-open',!win.closed);b.classList.toggle('is-minimized',!!win.minimized);});
    $('#focused-app').textContent=Object.values(state.desktop.windows).some(w=>!w.minimized&&!w.closed)&&WINDOW_META[state.app]?WINDOW_META[state.app].app:'Finder';
  }
  function focusWindow(app,reopen=true){
    const win=state.desktop.windows[app];if(!win)return;ui.showingDesktop=false;
    if(reopen){win.closed=false;win.minimized=false;}
    if(win.closed||win.minimized)return;
    if(state.app!==app){hideProposal();ui.visitedApps.add(state.app);ui.visitedApps.add(app);queueProposal('context');state.observations.switches++;ui.selected.clear();$$('.board-note.selected').forEach(note=>{note.classList.remove('selected');note.querySelector('small').textContent='A story still taking shape';});}
    state.app=app;win.z=++desktopZ;
    Object.keys(WINDOW_META).forEach(app=>applyWindow(app));refreshDock();save();
  }
  function renderWorkspace(){
    initializeDesktop();
    $('#workspace').innerHTML=Object.entries(WINDOW_META).map(([app,meta])=>`<section class="desktop-window" data-window="${app}" role="region" aria-label="${esc(meta.title)} window"><header class="window-bar" tabindex="0" aria-label="Move ${esc(meta.title)} window"><div class="window-controls traffic-lights"><button data-window-action="close" aria-label="Close ${esc(meta.title)}" title="Close">${icon('x')}</button><button data-window-action="minimize" aria-label="Minimize ${esc(meta.title)}" title="Minimize">${icon('minus')}</button><button data-window-action="maximize" aria-label="Maximize ${esc(meta.title)}" title="Maximize">${icon('arrows-out-simple')}</button></div><div class="window-title"><strong>${icon(meta.icon)}${esc(meta.title)}</strong><small>${esc(meta.file)} · Edited</small></div><span class="window-app-label">${esc(meta.app)}</span></header>${windowToolbar(app)}${windowContent(app)}<button class="window-resize" data-window-resize="${app}" aria-label="Resize ${esc(meta.title)} size" title="Drag to resize">${icon('arrows-out-simple')}</button></section>`).join('');
    Object.keys(WINDOW_META).forEach(app=>applyWindow(app));refreshDock();
    $('#add-row')?.addEventListener('click',()=>{state.rows.push(['New task','Unassigned','Unscheduled','Not started']);renderWorkspace();changed('table');save();});
  }
  function switchApp(app){focusWindow(app);closeMenu();closeAction();activity();}
  function nextVisibleWindow(){const visible=Object.entries(state.desktop.windows).filter(([,w])=>!w.closed&&!w.minimized).sort((a,b)=>b[1].z-a[1].z);if(visible.length)focusWindow(visible[0][0],false);else{state.app='document';refreshDock();$('#focused-app').textContent='Finder';}}
  $('#workspace').addEventListener('pointerdown',e=>{
    const windowEl=e.target.closest('.desktop-window');if(!windowEl)return;const app=windowEl.dataset.window;
    focusWindow(app,false);
    if(e.button!==0||e.target.closest('.window-controls'))return;
    const resizing=e.target.closest('[data-window-resize]'),bar=e.target.closest('.window-bar');
    if(!resizing&&!bar)return;
    const win=state.desktop.windows[app];if(win.maximized)return;
    windowGesture={app,type:resizing?'resize':'move',x:e.clientX,y:e.clientY,initial:{x:win.x,y:win.y,w:win.w,h:win.h},pointerId:e.pointerId};
    windowEl.setPointerCapture(e.pointerId);e.preventDefault();
  },true);
  document.addEventListener('pointermove',e=>{
    if(!windowGesture)return;const g=windowGesture,win=state.desktop.windows[g.app],dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(g.type==='move'){win.x=g.initial.x+dx;win.y=g.initial.y+dy;}else{win.w=g.initial.w+dx;win.h=g.initial.h+dy;}
    applyWindow(g.app);
  });
  document.addEventListener('pointerup',()=>{if(windowGesture){windowGesture=null;save();}});
  document.addEventListener('pointercancel',()=>windowGesture=null);
  $('#workspace').addEventListener('click',e=>{
    const button=e.target.closest('[data-window-action]');if(!button)return;const app=button.closest('[data-window]').dataset.window,win=state.desktop.windows[app],action=button.dataset.windowAction;
    if(action==='minimize')win.minimized=true;
    if(action==='close')win.closed=true;
    if(action==='maximize'){win.maximized=!win.maximized;focusWindow(app,false);}
    applyWindow(app);if(action!=='maximize')nextVisibleWindow();refreshDock();save();
  });
  $('#workspace').addEventListener('dblclick',e=>{const bar=e.target.closest('.window-bar');if(bar&&!e.target.closest('.window-controls'))bar.querySelector('[data-window-action="maximize"]').click();});
  $('#workspace').addEventListener('keydown',e=>{
    const bar=e.target.closest('.window-bar'),resize=e.target.closest('[data-window-resize]');if((!bar&&!resize)||e.target.closest('.window-controls')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const app=e.target.closest('[data-window]').dataset.window,win=state.desktop.windows[app];if(win.maximized)return;
    const step=e.shiftKey?40:16;if(resize){win.w+=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0;win.h+=e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0;}else{win.x+=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0;win.y+=e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0;}
    applyWindow(app);save();
  });
  $$('[data-app]').forEach(b=>b.addEventListener('click',()=>switchApp(b.dataset.app)));
  $$('[data-open-app]').forEach(b=>{
    b.addEventListener('click',()=>{if(Date.now()-(ui.lastFileDrag||0)>400)switchApp(b.dataset.openApp);});
    b.addEventListener('dragstart',e=>e.preventDefault());
    b.addEventListener('dragend',()=>ui.lastFileDrag=Date.now());
  });
  function arrangeWindows(){state.desktop={windows:initialWindows()};state.app='document';renderWorkspace();save();toast('Windows arranged. Your content and familiar tasks are safe.');}
  window.addEventListener('resize',()=>{Object.keys(WINDOW_META).forEach(app=>applyWindow(app));save();});
  /*__OS_SCRIPT__*/
  renderWorkspace();
  $('#onboarding').hidden=state.tourSeen;
