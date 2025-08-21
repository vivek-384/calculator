// Modal error popup logic
const modalError = document.getElementById('modalError');
const modalMsg = document.getElementById('modalMsg');
const modalClose = document.getElementById('modalClose');
function showModalError(msg) {
  modalMsg.textContent = msg;
  modalError.style.display = 'flex';
}
modalClose.onclick = function() {
  modalError.style.display = 'none';
}
window.onclick = function(event) {
  if (event.target === modalError) modalError.style.display = 'none';
}
// Simple calculator with variable support
const displayEl = document.getElementById('display');
const gridEl = document.getElementById('grid');
const varsRow = document.getElementById('varsRow');
const settingsBtn = document.getElementById('settingsBtn');
const panel = document.getElementById('panel');
const closePanel = document.getElementById('closePanel');
const addVarBtn = document.getElementById('addVar');
const varNameInput = document.getElementById('varName');
const varValueInput = document.getElementById('varValue');
const savedVars = document.getElementById('savedVars');
const varsCount = document.getElementById('varsCount');
const btnC = document.getElementById('btnC');
const btnCE = document.getElementById('btnCE');
const btnParen = document.getElementById('btnParen');
const btnEquals = document.getElementById('btnEquals');

const outputEl = document.getElementById('output');
const errorMsgEl = document.getElementById('errorMsg');


let expr = '';
let lastWasEquals = false;
let equalsCount = 0;

// variables storage
function loadVars(){
  try{ return JSON.parse(localStorage.getItem('calc-vars')||'{}'); }catch(e){return {}} }
function saveVars(obj){ localStorage.setItem('calc-vars', JSON.stringify(obj)); }

function renderVars(){
  const vars = loadVars();
  varsRow.innerHTML = '';
  const keys = Object.keys(vars);
  if(keys.length===0){
    const p = document.createElement('div'); p.className='hint'; p.style.color='#888'; p.textContent='No variables yet - tap gear to create'; varsRow.appendChild(p);
  }else{
    keys.forEach(k=>{
      const chip = document.createElement('button');
      chip.className='chip';
      chip.type = 'button';
      chip.innerHTML = `<div class="chip-label">${k}</div><div class="chip-value">${vars[k]}</div>`;
      chip.title = `Insert ${k}`;
      chip.onclick = ()=>{ insertText(k); }
      varsRow.appendChild(chip);
    });
  }
  // saved list in panel
  varsCount.textContent = keys.length;
  savedVars.innerHTML = '';
  if(keys.length===0){ savedVars.innerHTML = '<p class="empty">No variables saved yet</p>'; }
  else{
    keys.forEach(k=>{
      const row = document.createElement('div'); row.className='var-row';
      const left = document.createElement('div'); left.className='var-left';
      const pill = document.createElement('div'); pill.className='var-pill'; pill.textContent = k;
      const eq = document.createElement('div'); eq.textContent = '= ' + vars[k];
      left.appendChild(pill); left.appendChild(eq);
      const actions = document.createElement('div'); actions.className='var-actions';
      const edit = document.createElement('button'); edit.innerHTML='✏️'; edit.title='Edit';
      edit.onclick = ()=>{ varNameInput.value=k; varValueInput.value=vars[k]; }
      const del = document.createElement('button'); del.innerHTML='🗑️'; del.title='Delete';
      del.onclick = ()=>{ deleteVar(k); }
      actions.appendChild(edit); actions.appendChild(del);
      row.appendChild(left); row.appendChild(actions);
      savedVars.appendChild(row);
    });
  }
}

function deleteVar(name){ const vars = loadVars(); delete vars[name]; saveVars(vars); renderVars(); }

addVarBtn.addEventListener('click', ()=>{
  const name = (varNameInput.value||'').trim();
  const val = (varValueInput.value||'').trim();
  if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)){
    alert('Invalid name. Use letters, numbers, underscore, not starting with number.'); return; }
  if(val===''){ alert('Enter a value'); return; }
  const num = Number(val);
  if(isNaN(num)){ alert('Value must be a number.'); return; }
  const vars = loadVars(); vars[name]=num; saveVars(vars); varNameInput.value=''; varValueInput.value=''; renderVars();
});

settingsBtn.addEventListener('click', ()=>{ panel.classList.add('open'); });
closePanel.addEventListener('click', ()=>{ panel.classList.remove('open'); });

// keypad generation
const labels = ['7','8','9','4','5','6','1','2','3','0','.'];
labels.forEach(l=>{
  const b = document.createElement('button'); b.className='btn'; b.type = 'button'; b.textContent = l;
  b.addEventListener('click', ()=>{ insertText(l); });
  if(l==='0'){ b.classList.add('zero'); b.style.gridColumn='1/3'; }
  gridEl.appendChild(b);
});


function insertText(s) {
  // If last was equals, allow continuous calculation unless C or double ==
  if (lastWasEquals) {
    lastWasEquals = false;
    equalsCount = 0;
    // If user enters operator, continue with result
    if (/^[+\-*/]$/.test(s)) {
      expr = outputEl.textContent || '';
    } else {
      expr = '';
      outputEl.textContent = '';
    }
  }

  // Prevent invalid input: no double operators, no leading operator, no multiple decimals in a number
  const lastChar = expr.trim().slice(-1);
  if (/^[+\-*/]$/.test(s)) {
    if (expr === '' || /^[+\-*/.\s]$/.test(lastChar)) {
      showModalError('Invalid operator placement');
      return;
    }
    expr += ' ' + s + ' ';
  } else if (s === '.') {
    // Prevent multiple decimals in a number
    const parts = expr.split(/[^0-9.]+/);
    if (parts[parts.length - 1].includes('.')) {
      showModalError('Multiple decimals in a number');
      return;
    }
    expr += s;
  } else {
    expr += s;
  }
  displayEl.textContent = expr || '0';
  hideError();
  livePreview();
}


btnC.addEventListener('click', ()=>{
  expr='';
  displayEl.textContent='0';
  outputEl.textContent='';
  outputEl.style.color = '#bbb';
  hideError();
  equalsCount = 0;
});

btnCE.addEventListener('click', ()=>{
  expr = expr.slice(0,-1);
  displayEl.textContent = expr||'0';
  hideError();
  livePreview();
});

btnParen.addEventListener('click', ()=>{ insertText('('); });

// operator buttons
document.querySelectorAll('.op').forEach(b=>{
  b.addEventListener('click', ()=>{ insertText(' '+b.dataset.op+' '); });
});


btnEquals.addEventListener('click', ()=>{
  equalsCount++;
  if (equalsCount >= 2) {
    expr = '';
    displayEl.textContent = '0';
    outputEl.textContent = '';
    outputEl.style.color = '#bbb';
    hideError();
    equalsCount = 0;
    return;
  }
  evaluateExpr();
});


function evaluateExpr() {
  try {
    let e = expr;
    const vars = loadVars();
    Object.keys(vars).sort((a, b) => b.length - a.length).forEach(k => {
      const re = new RegExp('\\b' + k + '\\b', 'g');
      e = e.replace(re, String(vars[k]));
    });
    if (!/^[0-9+\-*/().\s]+$/.test(e)) throw new Error('Invalid characters');
    // Check for invalid operator placement
    if (/([+\-*/]{2,})|(^[+\-*/])|([+\-*/]$)/.test(e.replace(/\s+/g, ''))) throw new Error('Invalid operator placement');
    // Check for unbalanced parentheses
    if ((e.match(/\(/g) || []).length !== (e.match(/\)/g) || []).length) throw new Error('Unbalanced parentheses');
    const result = Function('return (' + e + ');')();
    outputEl.textContent = String(result);
    outputEl.style.color = '#222';
    displayEl.textContent = expr;
    expr = String(result);
    lastWasEquals = true;
    hideError();
  } catch (err) {
    showError('Invalid expression: ' + err.message);
  }
}

function livePreview() {
  if (!expr.trim()) {
    outputEl.textContent = '';
    return;
  }
  try {
    let e = expr;
    const vars = loadVars();
    Object.keys(vars).sort((a, b) => b.length - a.length).forEach(k => {
      const re = new RegExp('\\b' + k + '\\b', 'g');
      e = e.replace(re, String(vars[k]));
    });
    if (!/^[0-9+\-*/().\s]+$/.test(e)) throw new Error('');
    if (/([+\-*/]{2,})|(^[+\-*/])|([+\-*/]$)/.test(e.replace(/\s+/g, ''))) throw new Error('');
    if ((e.match(/\(/g) || []).length !== (e.match(/\)/g) || []).length) throw new Error('');
    const result = Function('return (' + e + ');')();
    outputEl.textContent = String(result);
    outputEl.style.color = '#bbb';
    hideError();
  } catch {
    outputEl.textContent = '';
  }
}

function showError(msg) {
  errorMsgEl.textContent = msg;
  errorMsgEl.style.display = 'block';
}
function hideError() {
  errorMsgEl.textContent = '';
  errorMsgEl.style.display = 'none';
}


// initialize
renderVars();
panel.classList.remove('open');
outputEl.style.color = '#bbb';
