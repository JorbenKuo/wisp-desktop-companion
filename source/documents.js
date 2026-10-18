/* Offline document readers. No file is uploaded or executed. */
const WitchDocuments = (() => {
  const MAX_FILE=20*1024*1024,MAX_CHARS=60000;
  const xml=s=>{const doc=new DOMParser().parseFromString(s,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Document structure could not be read');return doc;};
  const tags=(root,name)=>[...root.getElementsByTagName('*')].filter(el=>el.localName===name);
  const decode64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  let pdfPromise;
  async function zipReader(bytes) {
    if(!window.JSZip){const script=document.createElement('script');script.textContent=new TextDecoder().decode(decode64(DOCUMENT_VENDORS.zip));document.head.append(script);script.remove();}
    return window.JSZip.loadAsync(bytes);
  }
  async function zipText(zip,name) {
    const file=zip.file(name);if(!file)return '';
    if(file._data?.uncompressedSize>8*1024*1024)throw new Error('Unpacked page is too large. Split the material first.');
    return file.async('string');
  }
  function pdfReader() {
    if(!pdfPromise)pdfPromise=(async()=>{
      const moduleURL=URL.createObjectURL(new Blob([decode64(DOCUMENT_VENDORS.pdf)],{type:'text/javascript'}));
      try{const pdf=await import(moduleURL);pdf.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([decode64(DOCUMENT_VENDORS.worker)],{type:'text/javascript'}));return pdf;}finally{URL.revokeObjectURL(moduleURL);}
    })();
    return pdfPromise;
  }
  async function readPDF(bytes) {
    const lib=await pdfReader();const loading=lib.getDocument({data:new Uint8Array(bytes),useWorkerFetch:false,isEvalSupported:false,disableFontFace:true,useSystemFonts:true});
    loading.onPassword=()=>loading.destroy();
    const pdf=await loading.promise;
    try {
      const pages=[];const count=Math.min(pdf.numPages,50);let length=0;
      for(let i=1;i<=count;i++){const page=await pdf.getPage(i),content=await page.getTextContent();const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();pages.push('Page '+i+'\n'+text);length+=text.length;if(length>=MAX_CHARS)break;}
      const meaningful=pages.join('\n\n');if(!meaningful.replace(/Page \d+/g,'').trim())throw new Error('Scanned PDF has no readable text. OCR is needed first.');
      return {text:meaningful,note:'PDF text layer · '+Math.min(pages.length,pdf.numPages)+' / '+pdf.numPages+' pages'+(pdf.numPages>pages.length?' (remaining pages excluded)':'')+'; no image OCR'};
    }finally{await pdf.destroy();}
  }
  async function readOffice(bytes,ext) {
    const zip=await zipReader(bytes);let text='',note='';
    if(ext==='docx') {const raw=await zipText(zip,'word/document.xml');if(!raw)throw new Error('Word body not found');text=tags(xml(raw),'p').map(p=>p.textContent).join('\n');note='Word body · images, comments and revision semantics excluded';}
    if(ext==='pptx') {const names=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));if(!names.length)throw new Error('Presentation slides not found');const slides=[];for(const name of names.slice(0,100)){slides.push('Slide '+(slides.length+1)+'\n'+tags(xml(await zipText(zip,name)),'t').map(t=>t.textContent).join(' '));}text=slides.join('\n\n');note='Slide text · '+slides.length+' / '+names.length+' pages; images and notes excluded';}
    if(ext==='xlsx') {
      const sharedRaw=await zipText(zip,'xl/sharedStrings.xml'),shared=sharedRaw?tags(xml(sharedRaw),'si').map(el=>el.textContent):[];
      const book=await zipText(zip,'xl/workbook.xml'),bookDoc=book?xml(book):null;
      const names=Object.keys(zip.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/sheet(\d+)/)[1])-Number(b.match(/sheet(\d+)/)[1]));
      const relRaw=await zipText(zip,'xl/_rels/workbook.xml.rels'),relationships=relRaw?tags(xml(relRaw),'Relationship'):[];
      const order=bookDoc?tags(bookDoc,'sheet').map(sheet=>{const rel=relationships.find(el=>el.getAttribute('Id')===sheet.getAttribute('r:id')),target=rel?.getAttribute('Target');return {name:sheet.getAttribute('name'),path:target?(target.startsWith('/')?target.slice(1):'xl/'+target):null};}).filter(sheet=>sheet.path&&zip.file(sheet.path)):[];
      const ordered=order.length?order:names.map((path,i)=>({path,name:'Sheet '+(i+1)}));const sheets=[];
      for(const sheet of ordered.slice(0,25)){const doc=xml(await zipText(zip,sheet.path)),rows=tags(doc,'row').slice(0,1000).map(row=>tags(row,'c').map(c=>{const value=tags(c,'v')[0]?.textContent||'';return c.getAttribute('t')==='s'?(shared[Number(value)]||''):c.getAttribute('t')==='inlineStr'?tags(c,'t').map(t=>t.textContent).join(''):value;}).join(' | '));sheets.push(sheet.name+'\n'+rows.join('\n'));}
      text=sheets.join('\n\n');note='Excel text and cached values · up to 25 sheets, 1,000 rows each; formulas not recalculated, dates may be serial values';
    }
    if(['odt','ods','odp'].includes(ext)){const raw=await zipText(zip,'content.xml');if(!raw)throw new Error('Body text not found');text=tags(xml(raw),'p').map(p=>p.textContent).join('\n');note='OpenDocument paragraph text';}
    if(ext==='epub'){const names=Object.keys(zip.files).filter(n=>/\.(xhtml|html|htm)$/i.test(n));const parts=[];for(const n of names.slice(0,100)){parts.push(new DOMParser().parseFromString(await zipText(zip,n),'text/html').body.textContent);}text=parts.join('\n\n');note='EPUB text chapters · file order may differ from reading order';}
    return {text,note};
  }
  async function read(file) {
    const base={id:'file-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:file.name,size:file.size,kind:'file',status:'unreadable',text:'',note:''};
    try {
      if(file.size>MAX_FILE)throw new Error('File exceeds 20 MB. Split it before adding.');
      const ext=file.name.split('.').pop().toLowerCase(),bytes=await file.arrayBuffer();let result;
      if(ext==='pdf')result=await readPDF(bytes);
      else if(['docx','pptx','xlsx','odt','ods','odp','epub'].includes(ext))result=await readOffice(bytes,ext);
      else if(['doc','ppt','xls','pages','key','numbers'].includes(ext))throw new Error('Export as PDF, DOCX, PPTX or XLSX first');
      else if(file.type.startsWith('image/'))throw new Error('Image received. This demo has no OCR or image understanding yet.');
      else {
        const binary=new Uint8Array(bytes).slice(0,4096),utf16=binary[0]===255&&binary[1]===254?'utf-16le':binary[0]===254&&binary[1]===255?'utf-16be':null,control=[...binary].filter(n=>n===0||n<8||n>13&&n<32).length;
        if(!utf16&&control>binary.length*.02)throw new Error('File received, but no readable text can be extracted yet.');
        let text;if(utf16)text=new TextDecoder(utf16).decode(bytes);else try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('gb18030').decode(bytes);}
        if(['html','htm','svg','xml'].includes(ext)){const doc=new DOMParser().parseFromString(text,'text/html');doc.querySelectorAll('script,style,template').forEach(el=>el.remove());text=doc.body.textContent;}
        if(ext==='rtf')text=text.replace(/\\u(-?\d+)\??/g,(_,n)=>String.fromCharCode(Number(n)<0?Number(n)+65536:Number(n))).replace(/\\'[0-9a-f]{2}/gi,'').replace(/\\par\b/g,'\n').replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'');
        result={text,note:ext==='rtf'?'RTF basic text · complex formatting may be lost':'Extracted text · '+(ext||'text')};
      }
      const text=result.text.replace(/\u0000/g,'').trim();if(!text)throw new Error('No readable text was extracted');
      return {...base,status:'readable',text:text.slice(0,MAX_CHARS),note:result.note+(text.length>MAX_CHARS?'; first 60,000 characters only':'')};
    }catch(error){return {...base,note:error.name==='PasswordException'?'Protected PDF. Please unlock it first.':String(error.message||error)};}
  }
  return {read,MAX_CHARS};
})();
