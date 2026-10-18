  function windowToolbar(app){
    const labels={document:['Document','Body · 12 pt','All changes saved'],reference:['Inbox','Clara · Nightjar venue','3 reference notes'],table:['Event plan','100%','4 columns'],board:['Ideas','Free canvas','4 notes']};
    const a=labels[app];return `<div class="os-toolbar"><span>${icon(WINDOW_META[app].icon)}${a[0]}</span><span>${a[1]}</span><span>${a[2]}</span></div>`;
  }
  const OS_MENUS={
    file:[{heading:'OPEN A DEMO FILE'},...Object.entries(WINDOW_META).map(([app,m])=>({label:m.file,app,icon:m.icon}))],
    edit:[{label:'Select current document',action:'select',hint:'for a spell'},{label:'Clear selection',action:'deselect'}],
    view:[{label:'Arrange demo windows',action:'arrange'},{label:'Show desktop',action:'desktop'},{label:'Open all demo apps',action:'all'}],
    window:[...Object.entries(WINDOW_META).map(([app,m])=>({label:m.app+' — '+m.title,app,icon:m.icon})),{heading:'WINDOW CONTROLS'},{label:'Minimize active window',action:'minimize'},{label:'Zoom active window',action:'zoom'}],
    help:[{label:'Meet Wisp · walkthrough',action:'tour'},{label:'Keyboard & trackpad shortcuts',action:'shortcuts'},{label:'About this concept demo',action:'about'}]
  };
  function hideOsMenu(){ $('#os-menu').hidden=true;$$('[data-os-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));}
  $$('[data-os-menu]').forEach(button=>button.addEventListener('click',()=>{
    const open=button.getAttribute('aria-expanded')==='true';hideOsMenu();if(open)return;
    const menu=$('#os-menu');menu.innerHTML=OS_MENUS[button.dataset.osMenu].map(item=>item.heading?`<div class="os-menu-heading">${item.heading}</div>`:`<button ${item.app?`data-open-window="${item.app}"`:`data-os-action="${item.action}"`}>${item.icon?icon(item.icon):''}<span>${esc(item.label)}</span>${item.hint?`<small>${item.hint}</small>`:''}</button>`).join('');
    const r=button.getBoundingClientRect();menu.style.left=Math.min(r.x,innerWidth-340)+'px';menu.hidden=false;button.setAttribute('aria-expanded','true');
  }));
  function showDesktop(){Object.values(state.desktop.windows).forEach(win=>win.minimized=true);ui.showingDesktop=true;Object.keys(WINDOW_META).forEach(app=>applyWindow(app));refreshDock();$('#focused-app').textContent='Finder';save();}
  $('#os-menu').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;hideOsMenu();
    if(b.dataset.openWindow){switchApp(b.dataset.openWindow);return;}
    const action=b.dataset.osAction;
    if(action==='arrange')arrangeWindows();
    if(action==='desktop')showDesktop();
    if(action==='all'){Object.keys(WINDOW_META).forEach(app=>focusWindow(app));focusWindow('document');}
    if(action==='tour')$('#onboarding').hidden=false;
    if(action==='shortcuts')toast('Secondary-click: spells · Option + M: grimoire · Esc: close · Drag a title bar: move window');
    if(action==='about')toast('Wisp · a cursor companion concept. This desktop and AI tasks are simulated locally.');
    if(action==='deselect')window.getSelection()?.removeAllRanges();
    if(action==='select'){const target=$(`[data-window="${state.app}"] .window-body`);if(target){const range=document.createRange();range.selectNodeContents(target);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}}
    if(action==='minimize')$(`[data-window="${state.app}"] [data-window-action="minimize"]`)?.click();
    if(action==='zoom')$(`[data-window="${state.app}"] [data-window-action="maximize"]`)?.click();
  });
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.os-menubar,#os-menu'))hideOsMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideOsMenu();});
  $('#desktop-files-toggle').addEventListener('click',()=>showDesktop());
  $('#hide-desktop-hint').addEventListener('click',()=>$('.demo-hint').hidden=true);

  let fileGesture=null;
  $$('[data-open-app]').forEach(button=>button.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;fileGesture={app:button.dataset.openApp,x:e.clientX,y:e.clientY,dragging:false,ghost:null};button.setPointerCapture(e.pointerId);
  }));
  document.addEventListener('pointermove',e=>{
    const g=fileGesture;if(!g)return;
    if(!g.dragging&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>8){g.dragging=true;ui.lastFileDrag=Date.now();g.ghost=document.createElement('div');g.ghost.className='desktop-file-ghost';g.ghost.innerHTML=icon(WINDOW_META[g.app].icon)+'<span>'+esc(WINDOW_META[g.app].file)+'</span>';document.body.append(g.ghost);}
    if(!g.dragging)return;g.ghost.style.left=e.clientX+13+'px';g.ghost.style.top=e.clientY+14+'px';
    const target=document.elementFromPoint(e.clientX,e.clientY);$('#furnace-anchor').classList.toggle('drop-ready',!!target?.closest('#furnace-anchor,#furnace-panel'));
  });
  document.addEventListener('pointerup',e=>{
    const g=fileGesture;fileGesture=null;if(!g)return;g.ghost?.remove();$('#furnace-anchor').classList.remove('drop-ready');if(!g.dragging)return;
    ui.lastFileDrag=Date.now();const target=document.elementFromPoint(e.clientX,e.clientY);
    if(target?.closest('#furnace-anchor,#furnace-panel')){openFurnace();addTextMaterial(WINDOW_META[g.app].title,regionText({app:g.app}),'Copy of desktop file '+WINDOW_META[g.app].file);}
    else toast('Drop a desktop file onto the Idea Cauldron to add it.');
  });
  document.addEventListener('pointercancel',()=>{fileGesture?.ghost?.remove();fileGesture=null;$('#furnace-anchor').classList.remove('drop-ready');});
