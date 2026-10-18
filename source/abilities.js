  // Four stable user-invoked abilities. Specific extra help is offered as a proposal.
  function materialLines(source){return source.text.split(/\n+/).map(s=>s.trim()).filter(s=>s&&!/^\d{2}\s*\//.test(s));}
  function resultProposal(kind){
    if(!state.settings.proposals)return '';
    if(kind==='understand'&&ui.uses.understand>=2&&!state.habits.some(h=>h.text==='Lead with a short answer')&&!ui.shownProposals.has('remember-short')){ui.shownProposals.add('remember-short');return inlineProposal('remember','Prefer short summaries? May I remember that?','Remember this');}
    const watching=state.tasks.some(t=>t.watch&&t.source.app===ui.source.app&&t.source.region===ui.source.region&&!['cancelled','archived'].includes(t.status));
    const watchKey='watch|'+ui.source.scope;
    if(kind==='check'&&ui.source.app!=='furnace'&&!watching&&!ui.shownProposals.has(watchKey)){ui.shownProposals.add(watchKey);return inlineProposal('watch','Shall a Scout Bat keep an eye on changes here?','Let it watch');}
    return '';
  }
  function inlineProposal(kind,text,label){return `<aside class="result-proposal" aria-label="Wisp proposal"><span class="proposal-kicker">WISP PROPOSES</span><p>${esc(text)}</p><div><button data-proposal-action="${kind}">${esc(label)}</button><button data-proposal-action="dismiss-inline">Not now</button></div></aside>`;}
  function showAbilityResult(kind,title,body,detail=''){
    ui.uses[kind]++;ui.lastResult={kind,title,body};
    const familiar={understand:'book',check:'bat',create:'pot'}[kind];
    action(`<span class="card-kicker">${kind[0].toUpperCase()+kind.slice(1)} · ${esc(ui.source.scope)}</span><h2>${esc(title)}</h2><div class="ability-output">${esc(body)}</div>${detail}<div class="card-actions"><button class="primary" data-action="delegate-result" data-kind="${familiar}">Summon</button><button data-action="copy-result">Copy result</button><button data-action="close">Done</button></div>${resultProposal(kind)}<p class="card-minor">Local demo output · the original stays untouched.</p>`);
  }
  function showUnderstanding(){
    const lines=materialLines(ui.source),short=state.habits.some(h=>h.text==='Lead with a short answer');
    const points=lines.slice(0,short?2:4).map((line,i)=>(i+1)+'. '+line).join('\n\n');
    showAbilityResult('understand','Here is what this says.',points||'Select a passage or open a document to give me something to explain.');
  }
  function showChecking(){
    const result=localCheck(ui.source),lines=materialLines(ui.source);
    const evidence=lines.filter(line=>/Nov(?:ember)?\s*(8|10)|Unassigned|Unscheduled|reviv|memory|promise/i.test(line)).slice(0,4);
    const detail=evidence.length?`<div class="check-evidence"><strong>IN THE MATERIAL</strong>${evidence.map(line=>`<p>${esc(line)}</p>`).join('')}</div>`:'';
    showAbilityResult('check',result.title,result.body,detail);
  }
  function showCreating(){
    const text=ui.source.text;
    let title='Two directions to try.',body;
    if(/bookstore|bookmark|Nightjar/i.test(text)){
      title='A first draft for your quiet weekend.';
      body='A LITTLE LIGHT FOR THE WEEKEND\n\nStep into Nightjar Books and leave the hurry at the door. Choose a book, find a window seat and spend a little time at your own pace.\n\nTake a blank bookmark. Write down one thing you would like to let go of, then swap it with a stranger before you leave. No check-in tasks and no pressure to share.\n\nAnother direction: keep the bookmark exchange optional and make the window reading hour the whole experience.';
    }else if(ui.source.app==='board'){
      body='Direction 1 · A small exception\nLet one character discover a narrow exception to an existing rule. Show the cost before explaining why it works.\n\nDirection 2 · A change of perspective\nRetell the same event through someone who benefits from the rule. Let their actions reveal a different motive.\n\nThese are new possibilities, not additions to your canon.';
    }else{
      const anchor=materialLines(ui.source).find(line=>line.length>15)||ui.source.title;
      body='Starting point: '+anchor.slice(0,150)+'\n\nDirection 1 · Make a small version\nKeep the central goal and choose one action that can be tried immediately. Leave the uncertain details as questions.\n\nDirection 2 · Try another perspective\nDescribe the experience through someone encountering it for the first time. Build a draft around the moment they most need help.';
    }
    showAbilityResult('create',title,body);
  }
  $('#action-card').addEventListener('click',async e=>{
    if(!e.target.closest('[data-action="copy-result"]')||!ui.lastResult)return;
    const text=ui.lastResult.title+'\n\n'+ui.lastResult.body;
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
      else{const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px';document.body.append(area);area.select();if(!document.execCommand('copy'))throw new Error('copy unavailable');area.remove();}
      toast('Copied. Your original document is unchanged.');
    }catch{toast('Copy is unavailable here. You can select the result text instead.');}
  });
  function proposalBusy(){return ui.bookOpen||!$('#skill-menu').hidden||!$('#action-card').hidden||!$('#task-card').hidden||!$('#furnace-panel').hidden||!$('#onboarding').hidden||ui.drag||windowGesture;}
  function hideProposal(){if($('#witch-proposal'))$('#witch-proposal').hidden=true;ui.proposal=null;}
  function dismissProposal(){hideProposal();clearTimeout(ui.proposalTimer);ui.proposalCooldown=Date.now()+15000;}
  function chooseProposal(){
    const source=captureSource();
    if(source.app==='board'&&source.ids.length===2)return {kind:'connect',source,sprite:'star-thread',question:'May I find a connection between these two notes?',label:'Find the connection'};
    if(source.selected&&source.text.length>20)return {kind:'understand',source,sprite:'book_open',question:'May I turn this passage into a short summary?',label:'Yes, take a look'};
    const windows=state.desktop.windows;
    if(['document','table'].includes(state.app)&&ui.visitedApps.has('document')&&ui.visitedApps.has('table')&&!windows.document.closed&&!windows.table.closed){
      const materials=['document','table'].map(app=>({name:WINDOW_META[app].title,text:regionText({app}),note:'A copy you approved in a Wisp proposal'}));
      return {kind:'organize',source,materials,sprite:'book_right',question:'May I summarize the event draft and checklist together?',label:'Bring them together',scope:'Weekend event proposal + Event checklist'};
    }
    return null;
  }
  function queueProposal(reason){
    clearTimeout(ui.proposalTimer);hideProposal();
    if(!state.settings.proposals)return;
    ui.proposalTimer=setTimeout(()=>{
      if(proposalBusy()||Date.now()<ui.proposalCooldown||!$('#witch-proposal').hidden||!state.settings.visible)return;
      const p=chooseProposal();if(!p)return;
      const key=p.kind+'|'+p.source.scope+'|'+p.source.text;
      if(ui.shownProposals.has(key))return;ui.shownProposals.add(key);ui.proposal=p;
      const el=$('#witch-proposal');el.innerHTML=`<div class="proposal-heading">${image(p.sprite)}<span class="proposal-kicker">WISP HAS A THOUGHT</span></div><p>${esc(p.question)}</p><small>${esc(p.scope||p.source.scope)}</small><div class="proposal-actions"><button class="primary" data-proposal-action="accept">${esc(p.label)}</button><button data-proposal-action="dismiss">Not now</button></div><span class="proposal-demo">Context-based demo proposal</span>`;
      el.hidden=false;position(el,{x:ui.pos.x,y:ui.pos.y},ui.pos.x>innerWidth*.62);
    },reason==='selection'?850:1400);
  }
  function rememberShortAnswers(){
    if(!state.habits.some(h=>h.text==='Lead with a short answer'))state.habits.push({id:uid(),text:'Lead with a short answer',source:'Wisp proposed it; you confirmed',createdAt:Date.now()});
    save();toast('Remembered. You can forget this in your grimoire.');
  }
  function acceptProposal(){
    const p=ui.proposal;if(!p)return;hideProposal();ui.proposalCooldown=Date.now()+15000;ui.source=clone(p.source);
    if(p.kind==='connect')showConnect();
    if(p.kind==='understand')showUnderstanding();
    if(p.kind==='organize'){
      const fresh=p.materials.filter(m=>!state.furnace.materials.some(old=>old.name===m.name&&old.text===m.text));
      if(state.furnace.materials.length+fresh.length>12){toast('The cauldron needs room for these two materials first.');return;}
      openFurnace();fresh.forEach(m=>addTextMaterial(m.name,m.text,m.note));state.furnace.mode='outline';
      const source={app:'furnace',text:p.materials.map(m=>m.name+'\n'+m.text).join('\n\n'),materials:clone(p.materials),mode:'outline',intent:'Summarize these two documents together'};
      state.furnace.brewing=true;state.furnace.result=null;renderFurnace();
      setTimeout(()=>{state.furnace.brewing=false;state.furnace.result=furnaceReport(source);renderFurnace();save();},state.settings.reduced?150:2300);
    }
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-proposal-action]');if(!b)return;
    const actionName=b.dataset.proposalAction;
    if(actionName==='accept')acceptProposal();
    if(actionName==='dismiss')dismissProposal();
    if(actionName==='dismiss-inline')b.closest('.result-proposal').hidden=true;
    if(actionName==='remember'){rememberShortAnswers();b.closest('.result-proposal').hidden=true;}
    if(actionName==='watch')showDelegation('bat',{watch:true});
  });
  $('#workspace').addEventListener('pointerup',e=>{if(e.target.closest('[data-window]'))queueProposal('selection');});
  document.addEventListener('selectionchange',()=>{const sel=window.getSelection();if(sel?.toString().trim()&&$('#workspace').contains(sel.anchorNode))queueProposal('selection');});
