(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6);
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const STORE = 'pixel-witch-companion-en-v3';
  const DEFAULT = {
    app:'document',
    docs:[
      {id:'goal', title:'01 / The intention', text:'Give busy people a little time to themselves in the bookstore.\nThe event opens on November 8, with a budget of CNY 8,000.\nKeep it quiet and unhurried. Everyone joins at their own pace.'},
      {id:'experience', title:'02 / An unhurried experience', text:'Pick up a blank bookmark and write down one thing to let go of.\nChoose a book and a window seat. Swap bookmarks before leaving.\nNo check-in tasks. No pressure to share.'},
      {id:'schedule', title:'03 / A few loose ends', text:'The poster is due on November 10. Registration opens after that.\nCollect venue, print and supply quotes. Estimate: CNY 6,500.\nConfirm roles and the visitor route one day before opening.'}
    ],
    notes:[
      {id:'energy',title:'Energy rules',text:'Coldfire stones recharge with the tide.\nTheir stored light fades after low tide.',dx:0,dy:0},
      {id:'city',title:'City customs',text:'Mistport curfew begins at low tide.\nAt the bell, residents must return indoors.',dx:0,dy:0},
      {id:'rule',title:'The price of revival',text:'To bring someone back, the caster must lose\ntheir most treasured memory.',dx:0,dy:0},
      {id:'lia',title:'Character: Lia',text:'She brought her brother back to life.\nYet she still remembers their childhood promise.',dx:0,dy:0}
    ],
    rows:[['Venue confirmation','Lin','Nov 6','To confirm'],['Poster deadline','Yao','Nov 10','In progress'],['Doors open','Team','Nov 8','Not started'],['Print materials','Unassigned','Nov 7','To confirm']],
    refs:[{id:'venue',title:'Venue confirmation',text:'Available November 8, 14:00 to 20:00.\nCapacity: 40. Keep the window seats for reading.\nNo open flames inside.'},{id:'quote',title:'The quote',text:'Venue: CNY 3,000. Refundable deposit: CNY 1,000.\nBookmark printing: CNY 1,500. Other supplies: CNY 800.\nThe deposit is returned after the event, outside the final budget.'},{id:'reply',title:'One more thing',text:'Please publish the poster by November 6 so readers can plan ahead.\nNo group check-in needed. Readers can freely swap bookmarks.'}],desktop:null,
    link:'', tasks:[], habits:[], observations:{switches:0,edits:0,delegations:0},
    settings:{idle:true,reduced:false,visible:true,size:43,pace:'gentle',proposals:true}, tourSeen:false,
    furnace:{placed:true,materials:[],mode:'outline',intent:'',result:null,brewing:false}
  };
  let state = clone(DEFAULT);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && Array.isArray(saved.docs) && Array.isArray(saved.notes) && Array.isArray(saved.rows)) {
      state = {...clone(DEFAULT), ...saved, settings:{...DEFAULT.settings,...saved.settings}, observations:{...DEFAULT.observations,...saved.observations}};
      state.tasks = Array.isArray(saved.tasks) ? saved.tasks.filter(t => t && t.source && t.kind) : [];
      state.habits = Array.isArray(saved.habits) ? saved.habits : [];
      if (!['document','board','table','reference'].includes(state.app)) state.app = 'document';
    }
  } catch {}
  state.furnace={...clone(DEFAULT.furnace),...state.furnace,brewing:false};
  state.tasks.forEach(t=>{if(t.status==='summoning')t.status='running';});
  const APP_NAMES = {document:'Documents',board:'Canvas',table:'Sheets',reference:'References',furnace:'Idea Cauldron'};
  const FAMILIARS = {
    bat:{name:'Scout Bat',sprite:'bat_open',rest:'bat_rest',resultSprite:'bat_letter',job:'Check for inconsistencies',desc:'Checks & changes',phases:['Getting to know the material','Cross-checking the details','Writing a little report'],duration:14000},
    book:{name:'Page Sprite',sprite:'book_open',rest:'book_left',resultSprite:'envelope',job:'Organize into clear points',desc:'Sorts & summarizes',phases:['Gathering the entrusted pages','Finding a clearer order','Folding a little letter'],duration:12000},
    pot:{name:'Alchemy Imp',sprite:'pot_low',rest:'pot_high',resultSprite:'envelope',job:'Explore two possible directions',desc:'Ideas & possibilities',phases:['Measuring the ingredients','Trying a new recipe','Letting the draft settle'],duration:16000}
  };
  const commissionFor = kind => ui.source?.app==='furnace'&&kind==='pot'?({outline:'Summarize these materials',check:'Check relationships across these materials',draft:'Brew a draft from these materials'}[ui.source.mode]||'Continue brewing')+(ui.source.intent?': '+ui.source.intent:''):kind==='bat'&&state.habits.some(h=>h.text==='Check dates and responsibilities across my apps first')?'Check dates and responsibilities first':FAMILIARS[kind].job;
  const ui = {mouse:{x:innerWidth*.62,y:innerHeight*.53},pos:{x:innerWidth*.62,y:innerHeight*.53},lastActivity:performance.now(),lastCaption:'',source:null,kind:'bat',selected:new Set(),bookChapter:'guide',bookOpen:false,taskId:null,saveTimer:null,toastTimer:null,lastFrame:performance.now(),lastIdleAct:-1,drag:null,lastSpark:0,lastPersist:0,focusBeforeBook:null,errors:[],flight:0,uses:{understand:0,check:0,create:0},visitedApps:new Set(),shownProposals:new Set(),proposal:null,proposalTimer:null,proposalCooldown:0,lastContext:null,watchProposed:false};
  const witch = $('#witch'), witchSprite = $('#witch-sprite');
  const icon = (name, cls='') => `<img src="${OS_ICONS[name]}" alt="" class="os-icon ${cls}">`;
  const image = (name, cls='') => `<img src="${SPRITES[name]}" alt=""${cls ? ` class="${cls}"` : ''}>`;
  function fillSprites(root=document) { root.querySelectorAll('[data-sprite]').forEach(el => { if(SPRITES[el.dataset.sprite]) el.src = SPRITES[el.dataset.sprite]; }); }
  fillSprites();
  $$('[data-os-icon]').forEach(el=>el.src=OS_ICONS[el.dataset.osIcon]);
  function save(immediate=false) {
    clearTimeout(ui.saveTimer);
    const write = () => { try { localStorage.setItem(STORE,JSON.stringify(state)); $('#save-state').textContent='Saved on this device'; } catch { $('#save-state').textContent='Storage unavailable. This session still works.'; } };
    if (immediate) write(); else ui.saveTimer=setTimeout(write,350);
  }
  function toast(text) { clearTimeout(ui.toastTimer); $('#toast').textContent=text; $('#toast').hidden=false; ui.toastTimer=setTimeout(()=>$('#toast').hidden=true,3300); }
  function activity(e) {
    if(e&&Number.isFinite(e.clientX)){
      const last=ui.activityPoint||ui.mouse;ui.mouse={x:e.clientX,y:e.clientY};
      if(Math.hypot(e.clientX-last.x,e.clientY-last.y)<3)return;
      ui.activityPoint={...ui.mouse};
    }
    ui.lastActivity=performance.now();
  }
  function applySettings() {
    document.body.classList.toggle('reduce-motion',state.settings.reduced);
    document.body.classList.toggle('witch-hidden',!state.settings.visible);
    witchSprite.style.width=state.settings.size+'px'; witchSprite.style.height=state.settings.size+'px';
  }
  applySettings();
  /*__DESKTOP_SCRIPT__*/
  function regionText(source) {
    if(source.app==='furnace')return furnaceText();
    if(source.app==='reference'){const r=state.refs.find(r=>r.id===source.region);return r?r.text:state.refs.map(r=>r.title+'\n'+r.text).join('\n\n');}
    if(source.app==='document') {const d=state.docs.find(d=>d.id===source.region);return d?d.text:state.docs.map(d=>d.title+'\n'+d.text).join('\n\n');}
    if(source.app==='board') {const selected=source.ids?.length?state.notes.filter(n=>source.ids.includes(n.id)):state.notes;return selected.map(n=>n.title+'\n'+n.text).join('\n\n');}
    return state.rows.map(row=>row.join(' / ')).join('\n');
  }
  function captureSource(target) {
    const selection=window.getSelection();
    const selectedWindow=selection?.anchorNode?.parentElement?.closest('[data-window]');
    const targetWindow=target?.closest?.('[data-window]');
    const app=targetWindow?.dataset.window||state.app;
    const selected=selection && selection.rangeCount && $('#workspace').contains(selection.anchorNode)&&selectedWindow?.dataset.window===app ? selection.toString().trim() : '';
    const origin=(selected ? selection?.anchorNode?.parentElement?.closest('[data-region]') : null) || target?.closest?.('[data-region]');
    const region=origin?.dataset.region || null;
    let title=WINDOW_META[app]?.title||'Weekend event proposal';
    let ids=[];
    if(app==='document'&&region) title=state.docs.find(d=>d.id===region)?.title || title;
    if(app==='reference'&&region)title=state.refs.find(r=>r.id===region)?.title||title;
    if(app==='board') {
      ids=ui.selected.size?[...ui.selected]:region?[region]:[];
      if(ids.length) title=state.notes.filter(n=>ids.includes(n.id)).map(n=>n.title).join(' ＋ ');
    }
    const source={app,region:['document','reference'].includes(app)?region:null,ids,title,selected:!!selected,createdAt:Date.now()};
    source.text=selected||regionText(source);source.baseline=regionText(source);
    source.scope=APP_NAMES[source.app]+' · '+title+(selected?' (selected text)':'');
    return source;
  }
  function position(el,point,preferLeft=false) {
    const width=el.offsetWidth||340,height=el.offsetHeight||360;
    const x=preferLeft?point.x-width-24:point.x+20;
    el.style.left=clamp(x,12,innerWidth-width-12)+'px';
    el.style.top=clamp(point.y+14,58,Math.max(58,innerHeight-height-14))+'px';
    el.style.right='auto';
  }
  function closeMenu(){ $('#skill-menu').hidden=true; }
  function closeAction(){ $('#action-card').hidden=true; }
  function closeTask(){ $('#task-card').hidden=true;ui.taskId=null; }
  function summon(target) {
    if(ui.bookOpen)return;
    if(!$('#skill-menu').hidden){closeMenu();return;}
    ui.source=captureSource(target);hideProposal();closeAction();closeTask();
    $('#onboarding').hidden=true;state.tourSeen=true;save();
    $('#menu-context').textContent=ui.source.selected?'Your selected text is ready':ui.source.scope;
    const menu=$('#skill-menu');menu.hidden=false;
    menu.style.left=clamp(ui.mouse.x-148,15,Math.max(15,innerWidth-311))+'px';
    menu.style.top=clamp(ui.mouse.y-142,65,Math.max(65,innerHeight-330))+'px';
    ui.menuOrigin={x:parseFloat(menu.style.left)+148,y:parseFloat(menu.style.top)+142};
    activity();sparkles(ui.mouse.x+20,ui.mouse.y+20,7);
  }
  document.addEventListener('contextmenu',e=>{
    if(ui.bookOpen || e.target.closest('.floating-paper,#skill-menu,#furnace-anchor,#familiar-rail,.onboarding,.demo-bar'))return;
    e.preventDefault();activity(e);summon(e.target);
  });
  function action(content,point=ui.mouse) {
    hideProposal();closeMenu();closeTask();$('#action-card').innerHTML=`<button class="close" data-action="close" aria-label="Dismiss suggestion">×</button>`+content;
    $('#action-card').hidden=false;position($('#action-card'),point,point.x>innerWidth*.65);
  }
  function excerpt(source=ui.source) {return `<div class="selection-excerpt">${esc(source.text.slice(0,190))}${source.text.length>190?'…':''}</div>`;}
  function localCheck(source) {
    const text=source.text;
    if(/Nov(?:ember)?\s*10/i.test(text)&&/Nov(?:ember)?\s*8/i.test(text)) return {title:'The dates may need a second look.',body:'The event opens November 8, but the poster is due November 10. Should promotion start before opening? The poster may have another purpose; you decide.'};
    if(/reviv|back to life/i.test(text)&&/memory|promise/i.test(text)) return {title:'A memory that might break the rule.',body:'Revival costs a memory, yet Lia still remembers the promise. This could be foreshadowing, an exception or a different perspective. Leave a note for the author.'};
    if(/Unassigned|Unscheduled/i.test(text)) return {title:'A few tasks still need an owner.',body:'Some tasks are unassigned or unscheduled. Confirm their owners, then ask a familiar to keep an eye on the plan.'};
    return {title:'No issue matched the demo checks.',body:'The local rules found no confirmed issue in this scope. You can still review the dates, responsibilities and exceptions. Unprovided information has not been verified.'};
  }
  /*__ABILITY_SCRIPT__*/
  function showConnect() {
    if(state.app==='board' && (!ui.source.ids || ui.source.ids.length<2)) {
      const available=state.notes.filter(n=>!(ui.source.ids||[]).includes(n.id));
      action(`<span class="card-kicker">Star Thread · connect ideas</span><h2>Find a neighbour for this thought.</h2><p class="card-copy">${ui.source.ids?.length?'One note selected. Bring one more.':'Choose two notes to explore their connection.'}</p><div class="intent-options">${available.map(n=>`<button data-action="pick-note" data-id="${esc(n.id)}">${esc(n.title)}</button>`).join('')}</div><p class="card-minor">A connection stays only when you confirm it.</p>`);
      return;
    }
    const text=ui.source.text;
    const relation=/tide|Coldfire/i.test(text)&&/curfew/i.test(text)?{label:'Fading light may explain the curfew',body:'Low tide → fading light → restricted night activity. A possible cause, with the true motive left to you.'}:/reviv|back to life/i.test(text)&&/promise/i.test(text)?{label:'The cost of revival, and an exception',body:'The rule and the character story pull in different directions. Keep it as a clue or define the exception.'}:{label:'Connect the goal, constraints and actions',body:'Separate what you want, what limits it and what happens next. That may make the relationship clearer.'};
    action(`<span class="card-kicker">Star Thread · a possible connection</span><h2>${esc(relation.label)}</h2><p class="card-copy">${esc(relation.body)}</p>${excerpt()}<div class="card-actions"><button class="primary" data-action="keep-link" data-label="${esc(relation.label)}">${state.app==='board'?'Keep this connection':'Save this thought'}</button><button data-action="close">Not this time</button></div>`);
  }
  function showDelegation(kind='bat',options={}) {
    ui.kind=kind;ui.watchProposed=!!options.watch;
    action(`<span class="card-kicker">Summon · your choice, your task</span><h2>Call a familiar to your side.</h2><p class="card-copy">Keep working. It will bring its discoveries back.</p><div class="familiar-choices">${Object.entries(FAMILIARS).map(([key,f])=>`<button class="familiar-choice" data-action="choose-familiar" data-kind="${key}" aria-pressed="${key===kind}">${image(f.sprite)}<strong>${f.name}</strong><span>${f.desc}</span></button>`).join('')}</div><label class="card-label" for="commission">What would you like it to do?</label><textarea id="commission" class="card-input">${esc(commissionFor(kind))}</textarea><div class="consent-scope"><strong>Only this material goes with it</strong><br>${esc(ui.source.scope)}<br>${ui.source.selected?'Only the text you selected.':'A copy of the current scope.'}<label style="display:${ui.watchProposed?'block':'none'};margin-top:8px"><input id="watch-scope" type="checkbox" ${ui.watchProposed&&ui.source.app!=='furnace'?'checked':''} ${ui.source.app==='furnace'?'disabled':''}>  Keep watching changes to ${ui.source.selected?'the whole section':'this area'}</label><span id="watch-scope-note">${!ui.watchProposed?'This is a one-time task using the material shown above.':ui.source.app==='furnace'?'Files use an extracted copy. Original files are not monitored.':ui.source.selected?'This expands the scope to the whole section.':'Checks again only when the content changes.'}</span></div><div class="card-actions"><button class="primary" data-action="confirm-delegate">Summon familiar</button><button data-action="close">Keep working myself</button></div><p class="card-minor">Suggestions only. Pause or recall it at any time.<br>Familiar tasks and insights are simulated in this demo.</p>`);
  }
  $$('[data-skill]').forEach(b=>b.addEventListener('click',()=>{
    if(!ui.source)ui.source=captureSource();
    ({understand:showUnderstanding,check:showChecking,create:showCreating,summon:()=>showDelegation()})[b.dataset.skill]();
  }));
  $('#action-card').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const a=b.dataset.action;
    if(a==='close')closeAction();
    if(a==='delegate-result')showDelegation(b.dataset.kind||'book');
    if(a==='choose-familiar') {
      ui.kind=b.dataset.kind;$$('.familiar-choice').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.kind===ui.kind)));
      $('#commission').value=commissionFor(ui.kind);
      $('#watch-scope').checked=ui.watchProposed&&ui.source.app!=='furnace';
    }
    if(a==='confirm-delegate') {
      if(state.tasks.filter(t=>!['archived','cancelled'].includes(t.status)).length>=8){toast('Eight familiars are out. Archive a few letters first.');return;}
      const commission=$('#commission').value.trim();if(!commission){$('#commission').focus();toast('Give it a little instruction first.');return;}
      const source=clone(ui.source),watch=$('#watch-scope').checked;
      if(source.app==='furnace'&&ui.kind!=='pot')source.mode=ui.kind==='bat'?'check':'outline';
      if(watch&&source.selected){source.selected=false;source.text=source.baseline;source.scope=APP_NAMES[source.app]+' · '+source.title+' (whole section, including future edits)';}
      createTask(ui.kind,source,commission,watch);
    }
    if(a==='habit-preset')$('#habit-input').value=b.textContent;
    if(a==='save-habit') {
      const text=$('#habit-input').value.trim();if(!text){$('#habit-input').focus();return;}
      if(!state.habits.some(h=>h.text===text))state.habits.push({id:uid(),text,createdAt:Date.now(),source:'You told her directly'});
      closeAction();save();toast('Remembered. You can forget it in About You.');
    }
    if(a==='pick-note') {
      ui.source.ids=[...(ui.source.ids||[]),b.dataset.id];ui.selected=new Set(ui.source.ids);
      ui.source.title=state.notes.filter(n=>ui.source.ids.includes(n.id)).map(n=>n.title).join(' ＋ ');
      ui.source.text=regionText(ui.source);ui.source.baseline=ui.source.text;ui.source.scope='Canvas · '+ui.source.title;
      renderWorkspace();showConnect();
    }
    if(a==='keep-link') {
      if(state.app==='board'){state.link=b.dataset.label;renderWorkspace();}
      else state.habits.push({id:uid(),text:b.dataset.label,source:'A thought you confirmed',createdAt:Date.now()});
      closeAction();save();toast('Kept just the connection you chose.');
    }
  });
  function sparkles(x,y,count=10) {
    if(state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    for(let i=0;i<count;i++){const p=document.createElement('span');p.className='sparkle';p.style.left=x+(Math.random()-.5)*55+'px';p.style.top=y+(Math.random()-.5)*32+'px';p.style.animationDelay=Math.random()*.2+'s';$('#flight-layer').append(p);setTimeout(()=>p.remove(),1200);}
  }
  function familiarFlight(kind,from,to,reverse=false) {
    const f=FAMILIARS[kind],el=document.createElement('img');el.src=SPRITES[reverse?f.resultSprite:f.sprite];el.className='flight-sprite';$('#flight-layer').append(el);
    const start=performance.now(),duration=state.settings.reduced?100:1150;ui.flight=Date.now()+duration;
    function frame(now) {const t=clamp((now-start)/duration,0,1),ease=1-Math.pow(1-t,3);el.style.left=from.x+(to.x-from.x)*ease-20+'px';el.style.top=from.y+(to.y-from.y)*ease-Math.sin(t*Math.PI)*65-20+'px';el.style.transform=`rotate(${Math.sin(t*Math.PI)*12}deg) scale(${.6+t*.4})`;if(t<1)requestAnimationFrame(frame);else{el.remove();sparkles(to.x,to.y,7);}}
    requestAnimationFrame(frame);
  }
  function summonCeremony(kind,from,arrive) {
    const f=FAMILIARS[kind],reduced=state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const at={x:clamp(from.x,105,innerWidth-115),y:clamp(from.y,165,innerHeight-140)};
    const el=document.createElement('div');el.className='summon-ceremony';el.style.left=at.x+'px';el.style.top=at.y+'px';
    el.innerHTML=`${image('quiet-ring','ceremony-circle back')}${image('quiet-ring','ceremony-circle front')}<div class="summon-glow"></div>${image(f.sprite,'summoned-familiar')}<span class="summon-name">${f.name} answers your call.</span>`;
    $('#flight-layer').append(el);ui.castUntil=Date.now()+(reduced?160:1750);ui.castAt=at;sparkles(at.x,at.y,20);
    const frame=setInterval(()=>{const sprite=el.querySelector('.summoned-familiar');sprite.src=SPRITES[Math.floor(Date.now()/160)%2?f.sprite:f.rest];},160);
    setTimeout(()=>{clearInterval(frame);el.classList.add('departing');arrive(at);setTimeout(()=>el.remove(),500);},reduced?150:1700);
  }
  function createTask(kind,source,commission,watch) {
    const t={id:uid(),kind,source,commission,watch,status:'summoning',progress:0,elapsed:0,lastTick:Date.now(),createdAt:Date.now(),result:null,seen:false,cycle:1,version:0,reviewedVersion:-1};
    state.tasks.push(t);state.observations.delegations++;closeAction();closeMenu();
    renderRail();save();
    summonCeremony(kind,ui.menuOrigin||{x:ui.pos.x,y:ui.pos.y-50},at=>{
      if(t.status!=='summoning')return;t.status='running';t.lastTick=Date.now();renderRail();save();
      const mark=$(`[data-task="${t.id}"]`);if(mark){const r=mark.getBoundingClientRect();familiarFlight(kind,at,{x:r.x+r.width/2,y:r.y+r.height/2});}
      toast(FAMILIARS[kind].name+' is on its way. Its mark stays on the right.');
    });
  }
  function activeTasks(){return state.tasks.filter(t=>!['archived','cancelled'].includes(t.status));}
  function renderRail() {
    const tasks=activeTasks().filter(t=>t.status!=='summoning');$('#familiar-rail').hidden=!tasks.length;
    $('#familiar-marks').innerHTML=tasks.slice(0,8).map(t=>{
      const f=FAMILIARS[t.kind],status=t.status==='ready'?(t.seen?(t.watch?'Read · still watching':'Read · ready to archive'):'A letter is ready'):t.status==='paused'?'Paused':'Working in the background';
      return `<button class="familiar-mark ${t.status}${t.status==='ready'&&!t.seen?' unread':''}" data-task="${t.id}" aria-label="${esc(f.name+': '+status+', '+t.source.title)}" data-hint="${esc(f.name+' · '+status)}">${image(t.status==='ready'&&!t.seen?f.resultSprite:f.sprite)}<span class="mark-status"></span></button>`;
    }).join('');
    $('#book-task-count').textContent=String(tasks.length);
  }
  $('#familiar-marks').addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)showTask(b.dataset.task);});
  function furnaceText() {
    return state.furnace.materials.filter(m=>m.status==='readable').map(m=>'['+m.name+']\n'+m.text).join('\n\n');
  }
  function renderFurnaceAnchor() {
    $('#furnace-anchor').hidden=!state.furnace.placed;
    $('#furnace-count').textContent=state.furnace.materials.length;
    $('#furnace-anchor').classList.toggle('brewing',state.furnace.brewing);
  }
  function furnaceSource() {
    const materials=state.furnace.materials.filter(m=>m.status==='readable').map(m=>({name:m.name,text:m.text,note:m.note}));
    const text=furnaceText();
    return {app:'furnace',title:materials.length+' cauldron ingredient'+(materials.length===1?'':'s'),scope:'Idea Cauldron · '+materials.map(m=>m.name).join(', '),text,baseline:text,materials,mode:state.furnace.mode,intent:state.furnace.intent,createdAt:Date.now()};
  }
  function furnaceReport(source) {
    const materials=source.materials||[],intent=source.intent||'',mode=source.mode||'outline';
    const anchors=materials.map(m=>({name:m.name,lines:m.text.split(/[\n.!?]+/).map(s=>s.trim()).filter(s=>s.length>4).slice(0,3)}));
    const sources=anchors.map(m=>'['+m.name+']\n'+m.lines.map(line=>'· '+line.slice(0,160)).join('\n')).join('\n\n');
    let title,body;
    if(mode==='check') {
      const check=localCheck(source),hasQuestion=/second look|break the rule|need an owner/.test(check.title);
      title=hasQuestion?'One detail worth checking':'Lay out the scope first';
      body=(hasQuestion?check.title+'\n'+check.body:'The demo rules found no confirmed issue. You can still compare dates, terms and responsibilities across the materials.')+'\n\nFrom the original materials:\n'+sources;
    }else if(mode==='draft') {
      title='A first draft from your ingredients';
      const first=anchors.find(a=>a.lines.length)?.lines[0]||'First, clarify what you want to achieve';
      body=(intent?'Your brief: '+intent+'\n\n':'')+'Starting point\n'+first+'.\n\nA structure to keep\n'+sources+'\n\nNext steps\nConfirm the shared goal and leave uncertain details as questions. Use the original excerpts as a structure, adding your own judgement.';
    }else {
      title='A few clear points from '+materials.length+' material'+(materials.length===1?'':'s');
      body=(intent?'Focus: '+intent+'\n\n':'')+sources+'\n\nYou decide what is fact, what is an idea and what needs confirmation.';
    }
    body+='\n\nRead scope: '+materials.map(m=>m.name+' ('+m.note+')').join('; ')+'\n\nLocal demo rules, without live AI. Unread material is excluded.';
    return {title,body,snippet:source.text.slice(0,160)};
  }
  function renderFurnace() {
    const f=state.furnace,readable=f.materials.filter(m=>m.status==='readable'),loading=f.materials.some(m=>m.status==='reading');
    $('#furnace-panel').innerHTML=`<button class="close" data-furnace-action="close" aria-label="Close Idea Cauldron">×</button><div class="furnace-heading">${image(f.brewing?'pot_high':'pot_low')}<div><span class="card-kicker">Drop in a little raw material</span><h2>Idea Cauldron</h2></div></div><div class="furnace-dropzone"><strong>Almost anything can be an ingredient</strong><span>Drop a file, paste text or add the current document</span><div><button data-furnace-action="files">Choose files</button><button data-furnace-action="current">Add current document</button><button data-furnace-action="paste">Paste text</button></div></div><p class="furnace-formats">PDF · DOCX · PPTX · XLSX · TXT / MD / CSV / JSON and more<br>Reads text layers. Scans, images and unsupported formats are labelled separately.</p><div id="furnace-paste" hidden><label class="card-label" for="furnace-paste-text">Add a piece of text</label><textarea id="furnace-paste-text" class="card-input" placeholder="Paste an idea, an excerpt or another source here."></textarea><button data-furnace-action="add-paste" class="furnace-text-add">Add ingredient</button></div><div class="furnace-materials" aria-live="polite">${f.materials.length?f.materials.map(m=>`<div class="furnace-material ${m.status}">${image(m.status==='readable'?'book_closed':m.status==='reading'?'book_open':'envelope')}<div><strong>${esc(m.name)}</strong><small>${m.status==='reading'?'Reading text…':m.status==='readable'?'Read '+m.text.length.toLocaleString()+' characters · '+esc(m.note):'Excluded · '+esc(m.note)}</small></div><button data-furnace-remove="${m.id}" aria-label="Remove ${esc(m.name)}" ${f.brewing?'disabled':''}>×</button></div>`).join(''):'<div class="furnace-empty">An empty cauldron. Add your first ingredient.</div>'}</div><div class="furnace-recipes" role="group" aria-label="Brew recipe"><button data-furnace-mode="outline" aria-pressed="${f.mode==='outline'}">Understand</button><button data-furnace-mode="check" aria-pressed="${f.mode==='check'}">Check</button><button data-furnace-mode="draft" aria-pressed="${f.mode==='draft'}">Create</button></div><label class="card-label" for="furnace-intent">What would you like to brew?</label><textarea id="furnace-intent" class="card-input furnace-intent" placeholder="For example: turn these notes into an unhurried bookstore event proposal.">${esc(f.intent)}</textarea><div class="card-actions"><button class="primary" data-furnace-action="brew" ${!readable.length||loading||f.brewing?'disabled':''}>${f.brewing?'Brewing…':'Start brewing'}</button><button data-furnace-action="delegate" ${!readable.length||loading||f.brewing?'disabled':''}>Summon</button></div><p class="card-minor">${readable.length} readable material${readable.length===1?'':'s'} · up to 12 files, 20 MB each<br>Files are read locally. Results use demo rules.</p>${f.result?`<div class="furnace-result"><strong>${esc(f.result.title)}</strong><div>${esc(f.result.body)}</div><button data-furnace-action="export">Save this result</button></div>`:''}`;
    $('#furnace-panel').classList.toggle('is-brewing',f.brewing);renderFurnaceAnchor();
  }
  function openFurnace() {
    hideProposal();closeMenu();closeAction();closeTask();$('#onboarding').hidden=true;
    state.furnace.placed=true;$('#furnace-panel').hidden=false;renderFurnace();save();
  }
  function closeFurnace(){$('#furnace-panel').hidden=true;}
  $('#furnace-anchor').addEventListener('click',()=>$('#furnace-panel').hidden?openFurnace():closeFurnace());
  function addTextMaterial(name,text,note='Text you chose to add') {
    if(state.furnace.materials.length>=12){toast('Twelve ingredients already. Remove one to make room.');return;}
    text=text.trim();if(!text){toast('Add some text first.');return;}
    state.furnace.materials.push({id:uid(),kind:'text',name,text:text.slice(0,60000),status:'readable',note:note+(text.length>60000?'; first 60,000 characters only':'')});state.furnace.result=null;save();renderFurnace();
    sparkles(85,innerHeight-105,9);
  }
  async function addFiles(files) {
    openFurnace();const room=12-state.furnace.materials.length,list=[...files].slice(0,room);
    if(files.length>room)toast('The cauldron holds twelve ingredients. Adding the files that fit.');
    const pending=list.map(file=>({file,item:{id:uid(),name:file.name,status:'reading',text:'',note:'',kind:'file'}}));
    state.furnace.materials.push(...pending.map(p=>p.item));state.furnace.result=null;renderFurnace();
    for(const {file,item} of pending){const result=await WitchDocuments.read(file);const index=state.furnace.materials.findIndex(m=>m.id===item.id);if(index>=0)state.furnace.materials[index]={...result,id:item.id};if(!$('#furnace-panel').hidden)renderFurnace();save();}
    renderFurnaceAnchor();
  }
  $('#furnace-files').addEventListener('change',e=>{if(e.target.files.length)addFiles(e.target.files);e.target.value='';});
  $('#furnace-panel').addEventListener('input',e=>{if(e.target.id==='furnace-intent'){state.furnace.intent=e.target.value;save();}});
  $('#furnace-panel').addEventListener('click',e=>{
    const mode=e.target.closest('[data-furnace-mode]');if(mode){state.furnace.mode=mode.dataset.furnaceMode;$$('[data-furnace-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.furnaceMode===state.furnace.mode)));save();return;}
    const remove=e.target.closest('[data-furnace-remove]');if(remove){state.furnace.materials=state.furnace.materials.filter(m=>m.id!==remove.dataset.furnaceRemove);state.furnace.result=null;renderFurnace();save();return;}
    const b=e.target.closest('[data-furnace-action]');if(!b)return;const a=b.dataset.furnaceAction;
    if(a==='close')closeFurnace();
    if(a==='files')$('#furnace-files').click();
    if(a==='paste'){$('#furnace-paste').hidden=!$('#furnace-paste').hidden;if(!$('#furnace-paste').hidden)$('#furnace-paste-text').focus();}
    if(a==='add-paste')addTextMaterial('Pasted text '+(state.furnace.materials.length+1),$('#furnace-paste-text').value);
    if(a==='current'){const source=ui.source?.selected&&ui.source.app===state.app?ui.source:captureSource();addTextMaterial(source.title,source.text,'Copy from '+source.scope+'');}
    if(a==='brew') {
      const source=furnaceSource();if(!source.materials.length)return;state.furnace.brewing=true;state.furnace.result=null;renderFurnace();
      setTimeout(()=>{state.furnace.brewing=false;state.furnace.result=furnaceReport(source);renderFurnace();save();$('#furnace-panel .furnace-result')?.scrollIntoView({block:'nearest',behavior:state.settings.reduced?'instant':'smooth'});},state.settings.reduced?150:2300);
    }
    if(a==='delegate'){ui.source=furnaceSource();closeFurnace();showDelegation('pot');}
    if(a==='export'&&state.furnace.result){const result=state.furnace.result,url=URL.createObjectURL(new Blob(['# '+result.title+'\n\n'+result.body],{type:'text/markdown;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Wisp-cauldron-result.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  });
  let dragDepth=0;
  document.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();dragDepth++;$('#file-drop-veil').hidden=false;}});
  document.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('#file-drop-veil').hidden=true;});
  document.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')||([...e.dataTransfer.types].includes('application/x-witch-document')&&e.target.closest('#furnace-panel,#furnace-anchor'))){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
  document.addEventListener('drop',e=>{
    dragDepth=0;$('#file-drop-veil').hidden=true;
    if(e.dataTransfer.files.length){e.preventDefault();addFiles(e.dataTransfer.files);return;}
    const internal=e.dataTransfer.getData('application/x-witch-document');
    if(internal&&WINDOW_META[internal]){e.preventDefault();if(e.target.closest('#furnace-panel,#furnace-anchor')){openFurnace();addTextMaterial(WINDOW_META[internal].title,regionText({app:internal}),'Copy of desktop file '+WINDOW_META[internal].file+'');}else toast('Drop a desktop file onto the Idea Cauldron to add it.');return;}
    if(e.target.closest('#furnace-panel,#furnace-anchor')){const text=e.dataTransfer.getData('text/plain');if(text){e.preventDefault();openFurnace();addTextMaterial('Dropped text',text);}}
  });
  renderFurnaceAnchor();
  function taskResult(t) {
    if(t.source.app==='furnace')return furnaceReport(t.source);
    const text=t.source.text,lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean),kind=t.kind;
    if(kind==='bat') {
      const reading=localCheck(t.source);
      const hasIssue=/second look|break the rule|need an owner/.test(reading.title);
      return {title:hasIssue?'One thing to confirm':'A starting point for your review',body:reading.title+'\n\n'+reading.body+'\n\nThis letter covers only the material you entrusted to it.',snippet:text.slice(0,160)};
    }
    if(kind==='book') {
      const picks=lines.slice(0,4).map((line,i)=>(i+1)+'. '+line).join('\n');
      return {title:'A few points from scattered pages',body:'Gathered in the original order:\n\n'+picks+'\n\nPick the point that most needs your judgement. Your original stays where it was.',snippet:text.slice(0,160)};
    }
    const anchor=lines.find(l=>l.length>12)||lines[0]||'this material';
    return {title:'Two recipes to keep exploring',body:'Starting from “'+anchor.slice(0,52)+'”:\n\nRecipe one · Make a smaller version. Keep the experience that matters and one action you can try now.\n\nRecipe two · Try another perspective. Walk through it as a newcomer and note the moment you most want to ask a question.\n\nA demo draft from the current material, ready for your judgement.',snippet:text.slice(0,160)};
  }
  const statusText=t=>t.status==='summoning'?'Answering your call':t.status==='running'?'Working':t.status==='paused'?'Paused':t.status==='ready'?(t.seen?'Letter read':'Letter ready'):t.status==='archived'?'Archived':'Recalled';
  function sourceChanged(t){return regionText(t.source)!==t.source.baseline;}
  function showTask(id,fromBook=false) {
    const t=state.tasks.find(t=>t.id===id);if(!t)return;
    if(fromBook)closeBook();closeMenu();closeAction();ui.taskId=id;
    const f=FAMILIARS[t.kind],r=t.result;
    $('#task-card').innerHTML=`<button class="close" data-task-action="close" aria-label="Close task details">×</button><div class="task-header">${image(t.status==='ready'?f.resultSprite:f.sprite)}<div><span class="card-kicker">${f.name} task</span><strong>${esc(t.commission)}</strong></div></div><span class="task-status">${statusText(t)}${t.watch?' · watching changes':''}</span>${r?`<div class="task-result"><strong>${esc(r.title)}</strong>${esc(r.body)}</div>${sourceChanged(t)?'<div class="task-warning">The source has changed. This letter uses an earlier copy; ask for another look.</div>':''}`:`<div class="task-progress" role="progressbar" aria-label="Demo task progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(t.progress)}"><span style="width:${t.progress}%"></span></div><div class="task-phase">${t.status==='paused'?'Ready to continue when you are.':f.phases[Math.min(2,Math.floor(t.progress/34))]}</div><p class="card-copy">No need to wait here. Switch to another app and keep working.</p>`}<div class="task-source">Material scope: ${esc(t.source.scope)}<br>${t.watch?'You allowed it to watch changes in this area.':'Working only with the copy you provided.'}<br>Simulated task ${t.cycle>1?'· Check '+t.cycle+'':''}</div><div class="card-actions">${t.status==='running'||(t.status==='ready'&&t.watch)?'<button data-task-action="pause">Pause</button>':''}${t.status==='paused'?'<button class="primary" data-task-action="resume">Resume</button>':''}${r&&!['archived','cancelled','paused'].includes(t.status)?`<button class="primary" data-task-action="review">${t.watch?'Read, keep watching':'Archive letter'}</button><button data-task-action="rerun">Check again</button>`:''}${t.status==='archived'||t.status==='cancelled'?'':`<button data-task-action="cancel">Recall familiar</button>`}<button data-task-action="source">Return to source</button></div>${r?'<p class="card-minor">Your original is unchanged. You decide how to use this letter.</p>':''}`;
    $('#task-card').hidden=false;$('#task-card').style.left='auto';$('#task-card').style.right=innerWidth<500?'61px':'69px';
    const mark=$(`[data-task="${id}"]`),rect=mark?.getBoundingClientRect();
    $('#task-card').style.top=clamp((rect?.y||innerHeight*.25)-20,65,Math.max(65,innerHeight-$('#task-card').offsetHeight-15))+'px';
    if(t.status==='ready'&&!t.seen){t.seen=true;renderRail();save();}
  }
  function restartTask(t,refresh=true) {
    if(refresh){t.source.text=t.source.selected?t.source.text:regionText(t.source);t.source.baseline=regionText(t.source);}
    t.status='running';t.progress=0;t.elapsed=0;t.result=null;t.lastTick=Date.now();t.seen=false;t.cycle++;t.version++;save();renderRail();
  }
  $('#task-card').addEventListener('click',e=>{
    const b=e.target.closest('[data-task-action]'),t=state.tasks.find(t=>t.id===ui.taskId);if(!b||!t)return;
    const a=b.dataset.taskAction;
    if(a==='close'){closeTask();return;}
    if(a==='pause'){t.resumeStatus=t.status;t.status='paused';t.pausedAt=Date.now();}
    if(a==='resume'){t.status=t.resumeStatus||'running';t.lastTick=Date.now();if(t.watch&&sourceChanged(t))restartTask(t);}
    if(a==='rerun')restartTask(t);
    if(a==='review') {
      t.reviewedVersion=t.version;
      if(!t.watch){t.status='archived';closeTask();toast('Letter archived. Find it in your grimoire.');}
      else {t.seen=true;closeTask();toast('It will stay quietly on the right and watch for changes.');}
    }
    if(a==='cancel'){t.status='cancelled';closeTask();toast('Your familiar is back. The task has stopped.');}
    if(a==='source'){if(t.source.app==='furnace'){openFurnace();closeTask();}else{switchApp(t.source.app);closeTask();const region=t.source.region||(t.source.ids||[])[0];const target=region?$(`[data-region="${region}"]`):null;target?.scrollIntoView({behavior:state.settings.reduced?'instant':'smooth',block:'center'});target?.classList.add('soft-return');}}
    renderRail();save();if(!$('#task-card').hidden)showTask(t.id);
  });
  let lastTaskTick=Date.now();
  function updateTasks() {
    const now=Date.now(),dt=Math.min(now-lastTaskTick,2000);lastTaskTick=now;
    let changedState=false;
    state.tasks.forEach(t=>{
      if(t.status!=='running')return;
      t.elapsed=(t.elapsed||0)+dt;t.progress=Math.min(100,t.elapsed/FAMILIARS[t.kind].duration*100);
      if(t.progress>=100){t.status='ready';t.result=taskResult(t);t.finishedAt=now;t.seen=false;changedState=true;}
      if(ui.taskId===t.id && !$('#task-card').hidden) {
        if(t.status==='ready')showTask(t.id);
        else {const bar=$('#task-card .task-progress');bar?.setAttribute('aria-valuenow',String(Math.round(t.progress)));const span=bar?.querySelector('span');if(span)span.style.width=t.progress+'%';const phase=$('#task-card .task-phase');if(phase)phase.textContent=FAMILIARS[t.kind].phases[Math.min(2,Math.floor(t.progress/34))];}
      }
    });
    if(changedState){renderRail();save();if(ui.bookOpen&&ui.bookChapter==='tasks')renderChapter();}
    if(now-ui.lastPersist>4000&&state.tasks.some(t=>t.status==='running')){save();ui.lastPersist=now;}
  }
  setInterval(updateTasks,400);
  const watchTimers=new Map();
  function changed(app,region) {
    hideProposal();clearTimeout(ui.proposalTimer);state.observations.edits++;
    state.tasks.filter(t=>t.watch&&t.source.app===app&&!['cancelled','archived','paused'].includes(t.status)).forEach(t=>{
      if(t.source.region&&region&&t.source.region!==region)return;
      if(t.source.ids?.length&&region&&!t.source.ids.includes(region))return;
      clearTimeout(watchTimers.get(t.id));
      watchTimers.set(t.id,setTimeout(()=>{if(['cancelled','archived','paused'].includes(t.status))return;if(regionText(t.source)===t.source.baseline)return;restartTask(t);if(ui.taskId===t.id)showTask(t.id);},1500));
    });
  }
  $('#workspace').addEventListener('input',e=>{
    const el=e.target.closest('[data-edit]');if(!el)return;
    if(el.dataset.edit==='doc'){const d=state.docs.find(d=>d.id===el.dataset.id);if(d)d.text=el.innerText;changed('document',el.dataset.id);}
    if(el.dataset.edit==='ref'){const r=state.refs.find(r=>r.id===el.dataset.id);if(r)r.text=el.innerText;changed('reference',el.dataset.id);}
    if(el.dataset.edit==='note'){const n=state.notes.find(n=>n.id===el.dataset.id);if(n)n.text=el.innerText;changed('board',el.dataset.id);}
    if(el.dataset.edit==='cell'){state.rows[Number(el.dataset.row)][Number(el.dataset.col)]=el.innerText.replace(/\n/g,' ');changed('table');}
    save();activity();
  });
  $('#workspace').addEventListener('paste',e=>{
    if(!e.target.isContentEditable)return;e.preventDefault();const s=window.getSelection();if(!s?.rangeCount)return;const range=s.getRangeAt(0);range.deleteContents();const node=document.createTextNode(e.clipboardData?.getData('text/plain')||'');range.insertNode(node);range.setStartAfter(node);range.collapse(true);s.removeAllRanges();s.addRange(range);e.target.dispatchEvent(new Event('input',{bubbles:true}));
  });
  $('#workspace').addEventListener('pointerdown',e=>{
    const card=e.target.closest('.board-note');if(!card)return;
    if(e.shiftKey){e.preventDefault();const id=card.dataset.note;ui.selected.has(id)?ui.selected.delete(id):ui.selected.add(id);renderWorkspace();queueProposal('selection');return;}
    if(e.button!==0||!e.target.closest('.board-note h2'))return;
    const n=state.notes.find(n=>n.id===card.dataset.note);ui.drag={id:n.id,x:e.clientX,y:e.clientY,dx:n.dx||0,dy:n.dy||0};card.setPointerCapture(e.pointerId);e.preventDefault();
  });
  document.addEventListener('pointermove',e=>{
    activity(e);if(!ui.drag)return;const d=ui.drag,n=state.notes.find(n=>n.id===d.id),el=$(`[data-note="${d.id}"]`);if(!n||!el)return;
    n.dx=clamp(d.dx+e.clientX-d.x,-80,80);n.dy=clamp(d.dy+e.clientY-d.y,-45,80);el.style.setProperty('--dx',n.dx+'px');el.style.setProperty('--dy',n.dy+'px');
  });
  document.addEventListener('pointerup',()=>{if(ui.drag){ui.drag=null;save();}});
  document.addEventListener('pointercancel',()=>ui.drag=null);
  document.addEventListener('pointerdown',e=>{
    activity(e);if(!e.target.closest('#magic-layer,#book-overlay,.onboarding')){closeMenu();closeAction();closeTask();}
  });
  function renderChapter() {
    const chapter=ui.bookChapter;$$('[data-chapter]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.chapter===chapter)));
    const title={guide:'Getting to know each other',tasks:'Who is helping today',habits:'The little things she remembers',settings:'A rhythm that feels right'}[chapter];
    let html='';
    if(chapter==='guide') html=`<div class="guide-entry">${image('witch_idle')}<div><strong>A little life between tasks</strong><p>Pause for a moment. She adjusts her hat, sweeps up stardust or naps. While a familiar works, she reads or stirs a little inspiration.</p></div></div><div class="guide-entry">${image('bat_open')}<div><strong>Four basics, always at your fingertips</strong><p>Understand explains. Check finds gaps. Create drafts. Summon calls a familiar directly. Wisp proposes specific extra help, and waits for your answer.</p></div></div><div class="guide-entry">${image('book_closed')}<div><strong>Your grimoire, only when you need it</strong><p><kbd>⌥ M</kbd>  opens or closes it. <kbd>Esc</kbd>  closes it too. Find the guide, familiar tasks, confirmed preferences and settings here.</p></div></div><div class="book-notice">Use a two-finger secondary-click, or press  <kbd>Q</kbd>  for spells.<br>This browser demo simulates apps, familiar tasks and insights. It is not connected to live AI or your operating system. Tasks pause when the page closes.</div>`;
    if(chapter==='tasks') {
      const tasks=[...state.tasks].reverse();
      html=tasks.length?tasks.map(t=>`<button class="book-task" data-book-task="${t.id}">${image(FAMILIARS[t.kind].sprite)}<div><strong>${esc(t.commission)}</strong><small>${esc(t.source.scope)}</small></div><span class="book-task-status">${statusText(t)}</span></button>`).join(''):`<div class="empty-list">${image('bat_rest')}<p>Your familiars are resting.<br>Secondary-click on a document to send your first task.</p></div>`;
      html+='<div class="book-notice">Only the side mark lights up on completion. Archived letters and recalled tasks stay here too.</div>';
    }
    if(chapter==='habits') {
      html=`<p>First she listens, then learns your rhythm.<br>Every preference is confirmed by you and can be forgotten.</p>`;
      html+=state.habits.length?state.habits.map(h=>`<div class="habit-card"><div><strong>${esc(h.text)}</strong><p>${esc(h.source||'You told her')}</p></div><button data-forget="${h.id}" aria-label="Forget ${esc(h.text)}">Forget</button></div>`).join(''):`<div class="empty-list">${image('seal')}<p>No confirmed preferences yet.<br>Wisp may ask to remember a preference after helping you. Confirm it first.</p></div>`;
      if(state.observations.switches>=2&&!state.habits.some(h=>h.text==='Check dates and responsibilities across my apps first'))html+='<div class="book-notice"><strong>A thought you have not confirmed</strong><br>You moved between a few apps. Should she look at dates and responsibilities first next time?<br><button class="book-button" id="confirm-observation">Yes, remember this</button><small>This demonstrates the observe, ask, confirm learning loop.</small></div>';
      html+=`<h3>This session, together</h3><div class="learned-hint">App switches: ${state.observations.switches} · Edits: ${state.observations.edits} · Tasks: ${state.observations.delegations}</div><p>These are simple counts in this demo. Real understanding would develop through feedback you can review and confirm.</p>`;
    }
    if(chapter==='settings') html=`<label class="setting-row"><div><strong>Helpful proposals</strong><small>Wisp asks before connecting, remembering or watching.</small></div><input type="checkbox" data-setting="proposals" ${state.settings.proposals?'checked':''}></label><label class="setting-row"><div><strong>Cursor companion</strong><small>Hide her for a while. Familiars keep working.</small></div><input type="checkbox" data-setting="visible" ${state.settings.visible?'checked':''}></label><label class="setting-row"><div><strong>Idle antics</strong><small>A small idle action after about one second.</small></div><input type="checkbox" data-setting="idle" ${state.settings.idle?'checked':''}></label><label class="setting-row"><div><strong>Reduce motion</strong><small>Quieter movement, without swaying or flights.</small></div><input type="checkbox" data-setting="reduced" ${state.settings.reduced?'checked':''}></label><label class="setting-row"><div><strong>Companion size</strong><small><span id="size-value">${state.settings.size}</span> px. Leaves room around your words.</small></div><input type="range" class="book-range" min="30" max="54" value="${state.settings.size}" data-setting="size" aria-label="Companion size"></label><label class="setting-row"><div><strong>Idle pace</strong><small>Gentle: 1.2 s. Playful: 0.65 s.</small></div><select class="book-select" data-setting="pace" aria-label="Idle pace"><option value="gentle" ${state.settings.pace==='gentle'?'selected':''}>Gentle</option><option value="lively" ${state.settings.pace==='lively'?'selected':''}>Playful</option></select></label><div class="book-notice">Content and preferences stay in this browser. The demo does not track your cursor in other software or send your text anywhere.</div><button class="book-button" id="export-notebook">Export notebook</button><button class="book-button" id="reset-demo">Reset demo desktop</button><div id="reset-confirm" hidden><p>Resets all four apps, tasks and preferences in this English demo. Export your notebook first if you want to keep it.</p><button class="book-button" id="confirm-reset">Confirm reset</button><button class="book-button" id="cancel-reset">Keep my session</button></div>`;
    $('#chapter-content').innerHTML=`<span class="chapter-kicker">${{guide:'HOW WE GET ALONG',tasks:'THE FAMILIAR REGISTER',habits:'A FEW THINGS ABOUT YOU',settings:'MAKE YOURSELF COMFORTABLE'}[chapter]}</span><h3 class="chapter-title">${title}</h3><div class="chapter-scroll">${html}</div>`;
    $('#book-side-note').innerHTML={guide:'Your words, your decisions.<br>My magic stays where you invite it.',tasks:'Go back to your flow.<br>They will bring their discoveries home.',habits:'Familiarity takes a little time.<br>Anything remembered can be forgotten.',settings:'Your rhythm comes first.<br>Let us make the magic feel like you.'}[chapter];
  }
  function openBook() {
    hideProposal();closeMenu();closeAction();closeTask();closeFurnace();hideOsMenu();ui.focusBeforeBook=document.activeElement;ui.bookOpen=true;
    $('#grimoire').style.setProperty('--book-from-x',(ui.pos.x-innerWidth*.5)+'px');
    $('#grimoire').style.setProperty('--book-from-y',(ui.pos.y-innerHeight*.5)+'px');
    $('#book-overlay').hidden=false;renderChapter();$('#grimoire').focus();
    $('#grimoire').classList.add('opening');
    setTimeout(()=>$('#grimoire').classList.remove('opening'),state.settings.reduced?0:520);
    $('#desktop').inert=true;$('.demo-bar').inert=true;$('#onboarding').inert=true;$('#magic-layer').inert=true;activity();
  }
  function closeBook() {
    ui.bookOpen=false;$('#book-overlay').hidden=true;$('#desktop').inert=false;$('.demo-bar').inert=false;$('#onboarding').inert=false;$('#magic-layer').inert=false;
    if(ui.focusBeforeBook?.isConnected)ui.focusBeforeBook.focus({preventScroll:true});activity();
  }
  $('#close-book').addEventListener('click',closeBook);
  $('#book-overlay').addEventListener('click',e=>{if(e.target===$('#book-overlay'))closeBook();});
  $$('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{ui.bookChapter=b.dataset.chapter;renderChapter();}));
  $('#chapter-content').addEventListener('input',e=>{
    const el=e.target.closest('[data-setting]');if(!el)return;const name=el.dataset.setting;
    state.settings[name]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;
    if(name==='proposals'&&!el.checked){hideProposal();clearTimeout(ui.proposalTimer);}
    if(name==='size')$('#size-value').textContent=el.value;
    applySettings();save();
  });
  $('#chapter-content').addEventListener('click',e=>{
    const task=e.target.closest('[data-book-task]');if(task){showTask(task.dataset.bookTask,true);return;}
    const forget=e.target.closest('[data-forget]');if(forget){state.habits=state.habits.filter(h=>h.id!==forget.dataset.forget);renderChapter();save();return;}
    if(e.target.id==='confirm-observation'){state.habits.push({id:uid(),text:'Check dates and responsibilities across my apps first',source:'Suggested by Wisp, confirmed by you',createdAt:Date.now()});renderChapter();save();return;}
    if(e.target.id==='export-notebook') {
      const blob=new Blob([JSON.stringify({format:'pixel-witch-notebook-v2',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Wisp-notebook.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Notebook exported. Keep it somewhere safe.');
    }
    if(e.target.id==='reset-demo')$('#reset-confirm').hidden=false;
    if(e.target.id==='cancel-reset')$('#reset-confirm').hidden=true;
    if(e.target.id==='confirm-reset') {
      watchTimers.forEach(clearTimeout);watchTimers.clear();state=clone(DEFAULT);state.tourSeen=true;ui.selected.clear();ui.source=null;hideProposal();ui.shownProposals.clear();renderWorkspace();renderRail();renderFurnaceAnchor();closeFurnace();applySettings();renderChapter();save(true);toast('The demo desktop is ready for a fresh start.');
    }
  });
  document.addEventListener('keydown',e=>{
    activity();const editing=e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    if(e.altKey&&e.code==='KeyM'){e.preventDefault();ui.bookOpen?closeBook():openBook();return;}
    if(e.key==='Escape'){e.preventDefault();if(ui.bookOpen)closeBook();else if(!$('#task-card').hidden)closeTask();else if(!$('#action-card').hidden)closeAction();else if(!$('#furnace-panel').hidden)closeFurnace();else if(!$('#witch-proposal').hidden)dismissProposal();else closeMenu();return;}
    if(ui.bookOpen&&e.key==='Tab') {
      const focusable=$$('#grimoire button:not([hidden]),#grimoire input,#grimoire select').filter(el=>el.offsetParent!==null),first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('#grimoire'))){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    if(!editing&&!ui.bookOpen&&e.code==='KeyQ'){e.preventDefault();summon(document.activeElement);}
  });
  function dismissTour(){state.tourSeen=true;$('#onboarding').hidden=true;save();}
  $('#dismiss-tour').addEventListener('click',dismissTour);
  $('#wait-idle').addEventListener('click',()=>{dismissTour();ui.lastActivity=performance.now()-6000;toast('Pause a moment and see what she gets up to.');});
  $('#try-delegate').addEventListener('click',()=>{dismissTour();ui.source=captureSource();ui.mouse={x:innerWidth*.54,y:innerHeight*.35};showDelegation('bat');});
  function animate(now) {
    const dt=Math.min(.06,(now-ui.lastFrame)/1000);ui.lastFrame=now;
    const idleFor=now-ui.lastActivity,threshold=state.settings.pace==='lively'?650:1200;
    const overlays=!$('#witch-proposal').hidden||!$('#skill-menu').hidden||!$('#action-card').hidden||!$('#task-card').hidden||!$('#furnace-panel').hidden||ui.bookOpen;
    const running=state.tasks.filter(t=>t.status==='running'),idle=idleFor>threshold&&state.settings.idle&&!overlays;
    let pose='witch_idle',act='',caption='',mode='follow';
    if(idle) {
      const cycle=Math.floor((idleFor-threshold)/2400)%3;
      if(running.length){mode='thinking';const t=running[Math.floor((idleFor-threshold)/6500)%running.length];pose=t.kind==='pot'?'witch_stir':'witch_book';act=t.kind==='pot'?'brew':'read';caption=t.kind==='pot'?'Brewing a little inspiration':'Finding a note for a familiar';}
      else {mode='idle';act=['hat','sweep','nap'][cycle];pose=act==='sweep'?'witch_wand':'witch_idle';caption=['A little hat adjustment','Sweeping up stardust','A tiny nap'][cycle];}
    } else if(!$('#action-card').hidden)pose='witch_book';
    if(Date.now()<(ui.castUntil||0)){pose='witch_wand';act='hat';mode='summoning';caption='Answering the call…';}
    if(witchSprite.dataset.pose!==pose){witchSprite.src=SPRITES[pose];witchSprite.dataset.pose=pose;}
    if(witch.dataset.act!==act)witch.dataset.act=act;
    if(witch.dataset.mode!==mode)witch.dataset.mode=mode;
    if(ui.lastCaption!==caption){$('#witch-caption').textContent=caption;ui.lastCaption=caption;}
    const target={x:clamp(ui.mouse.x+19,5,innerWidth-64),y:clamp(ui.mouse.y+22,49,innerHeight-90)};
    if(!$('#skill-menu').hidden&&ui.menuOrigin){target.x=ui.menuOrigin.x-19;target.y=ui.menuOrigin.y-28;}
    if(Date.now()<(ui.castUntil||0)&&ui.castAt){target.x=ui.castAt.x-72;target.y=ui.castAt.y-25;}
    if(ui.bookOpen){target.x=innerWidth*.5-28;target.y=innerHeight*.5+80;}
    const reduced=state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const blend=reduced?1:1-Math.exp(-dt*13);ui.pos.x+=(target.x-ui.pos.x)*blend;ui.pos.y+=(target.y-ui.pos.y)*blend;
    witch.style.transform=`translate(${Math.round(ui.pos.x)}px,${Math.round(ui.pos.y)}px)`;
    if(idle&&!reduced&&act!=='nap'&&now-ui.lastSpark>1600){sparkles(ui.pos.x+24,ui.pos.y+30,1);ui.lastSpark=now;}
    witch.style.opacity=ui.bookOpen||!$('#skill-menu').hidden?'0':'1';requestAnimationFrame(animate);
  }
  document.addEventListener('visibilitychange',()=>{lastTaskTick=Date.now();save(true);});
  window.addEventListener('pagehide',()=>save(true));
  window.addEventListener('resize',()=>{closeMenu();closeAction();if(ui.taskId)showTask(ui.taskId);});
  window.addEventListener('error',e=>{ui.errors.push(e.message);$('#runtime-error').hidden=false;$('#runtime-error').textContent='Runtime issue: '+e.message;});
  window.addEventListener('unhandledrejection',e=>{ui.errors.push(String(e.reason));$('#runtime-error').hidden=false;$('#runtime-error').textContent='Runtime issue: '+String(e.reason);});
  renderRail();requestAnimationFrame(animate);
})();
