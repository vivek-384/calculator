// Show short error in result area but log full details to console
function showModalError(detail) {
  // detail may be an Error or a string; log full information for debugging
  if (detail instanceof Error) {
    console.error('Calculator error:', detail.message);
    if (detail.stack) console.error(detail.stack);
  } else {
    console.error('Calculator error:', detail);
  }

  // UI should show only short error text
  outputEl.textContent = 'Error';
  outputEl.classList.remove('final-result', 'preview-result');
  outputEl.style.color = '#d32f2f';
}

function hideModalError() {
  outputEl.classList.remove('final-result');
  outputEl.classList.add('preview-result');
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

// Add click handlers to number buttons
document.querySelectorAll('.grid .btn:not(.op):not(#btnC):not(#btnCE):not(#btnParen):not(#btnEquals)').forEach(btn => {
  btn.addEventListener('click', () => {
    insertText(btn.textContent);
  });
});


function insertText(s) {
  // Handle operator after result for continuous calculation
  if (lastWasEquals) {
    lastWasEquals = false;
    equalsCount = 0;
    
    if (/^[+\-*/÷]$/.test(s)) {
      // Use the result for continued calculation
      expr = outputEl.textContent || '0';
      displayEl.textContent = expr;
    } else {
      // Start new calculation for numbers and other inputs
      expr = '';
      outputEl.textContent = '';
      outputEl.classList.remove('final-result');
      outputEl.classList.add('preview-result');
    }
  }

  // Validate input before adding
  const lastChar = expr.trim().slice(-1);
  
  if (/^[+\-*/]$/.test(s)) {
    if (expr === '') {
      showModalError('Cannot start with an operator');
      return;
    }
    if (/^[+\-*/.\s]$/.test(lastChar)) {
      showModalError('Cannot have two operators in a row');
      return;
    }
    expr += ' ' + s + ' ';
  } else if (s === '.') {
    const parts = expr.split(/[+\-*/\s()]+/);
    const currentNum = parts[parts.length - 1] || '';
    if (currentNum.includes('.')) {
      showModalError('Number already has a decimal point');
      return;
    }
    if (!/^\d*$/.test(currentNum)) {
      showModalError('Invalid decimal point placement');
      return;
    }
    expr += s;
  } else if (s === '(') {
    if (lastChar && !/^[+\-*/(\s]$/.test(lastChar)) {
      showModalError('Invalid placement of opening parenthesis');
      return;
    }
    expr += s;
  } else if (s === ')') {
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    if (closeCount >= openCount) {
      showModalError('No matching opening parenthesis');
      return;
    }
    if (/^[+\-*/(\s]$/.test(lastChar)) {
      showModalError('Invalid placement of closing parenthesis');
      return;
    }
    expr += s;
  } else {
    expr += s;
  }
  
  displayEl.textContent = expr || '0';
  hideModalError();
  livePreview();
}


btnC.addEventListener('click', ()=>{
  expr='';
  displayEl.textContent='0';
  outputEl.textContent='';
  outputEl.classList.remove('final-result');
  outputEl.classList.add('preview-result');
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
  b.addEventListener('click', ()=>{ 
    const op = b.dataset.op === '÷' ? '/' : b.dataset.op;
    insertText(op);
  });
});


btnEquals.addEventListener('click', ()=>{
  if (!expr.trim()) {
    return;
  }
  
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


function validateExpr(e) {
  e = e.replace(/÷/g, '/');
  
  try { console.debug('validateExpr normalized:', JSON.stringify(e)); } catch (err) {}

  if (!/^[0-9+\-*/().\s]+$/.test(e)) {
    const invalid = e.match(/[^0-9+\-*/().\s]/g) || [];
    console.error('validateExpr: invalid characters found:', invalid, 'raw:', JSON.stringify(e));
    throw new Error('Error');
  }

  const stripped = e.replace(/\s+/g, '');
  if (/[+\-*/]{2,}/.test(stripped) || /^[+\-*/]/.test(stripped) || /[+\-*/]$/.test(stripped)) {
    throw new Error('Error');
  }

  const openCount = (e.match(/\(/g) || []).length;
  const closeCount = (e.match(/\)/g) || []).length;
  if (openCount !== closeCount || /\(\s*\)/.test(e)) {
    throw new Error('Error');
  }

  const parts = e.split(/[+\-*/()]/);
  for (const part of parts) {
    if (part.trim().split('.').length > 2) {
      throw new Error('Error');
    }
  }
}

function calculate(expression) {
  expression = expression.replace(/\s+/g, '');
  
  while (expression.includes('(')) {
    expression = expression.replace(/\([^()]+\)/g, match => {
      return calculate(match.slice(1, -1));
    });
  }

  const tokens = [];
  let num = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char >= '0' && char <= '9' || char === '.') {
      num += char;
    } else {
      if (num !== '') {
        tokens.push(parseFloat(num));
        num = '';
      }
      if ('+-*/'.includes(char)) {
        tokens.push(char);
      }
    }
  }
  if (num !== '') {
    tokens.push(parseFloat(num));
  }

  let i = 1;
  while (i < tokens.length - 1) {
    if (tokens[i] === '*' || tokens[i] === '/') {
      const left = tokens[i - 1];
      const right = tokens[i + 1];
      let result;

      if (tokens[i] === '*') {
        result = left * right;
      } else {
        if (right === 0) throw new Error('Error');
        result = left / right;
      }

      tokens.splice(i - 1, 3, result);
    } else {
      i += 2;
    }
  }

  let result = tokens[0];
  for (let i = 1; i < tokens.length; i += 2) {
    if (tokens[i] === '+') result += tokens[i + 1];
    if (tokens[i] === '-') result -= tokens[i + 1];
  }

  if (!isFinite(result)) throw new Error('Error');
  
  return result;
}

function evaluateExpr() {
  try {
    let e = expr.replace(/÷/g, '/');
    console.debug('evaluateExpr using expr:', JSON.stringify(e));
    const vars = loadVars();
    Object.keys(vars).sort((a, b) => b.length - a.length).forEach(k => {
      const re = new RegExp('\\b' + k + '\\b', 'g');
      e = e.replace(re, String(vars[k]));
    });

    validateExpr(e);

    let numericResult;
    try {
      numericResult = Function('return (' + e + ');')();
      if (!isFinite(numericResult)) throw new Error('Error');
    } catch (inner) {
      numericResult = Number(calculate(e));
      if (!isFinite(numericResult)) throw new Error('Error');
    }

    // ✅ Show only up to 3 decimals
    outputEl.textContent = 
      (typeof numericResult === 'number' ? parseFloat(numericResult.toFixed(3)) : String(numericResult));

    outputEl.classList.remove('preview-result');
    outputEl.classList.add('final-result');
    displayEl.textContent = expr;
    expr = String(numericResult);
    lastWasEquals = true;
    hideModalError();
  } catch (err) {
    showModalError(err);
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
    try {
      const preview = Function('return (' + e + ');')();
      outputEl.textContent = 
        (typeof preview === 'number' ? parseFloat(preview.toFixed(3)) : String(preview));
    } catch {
      const val = calculate(e);
      outputEl.textContent = 
        (typeof val === 'number' ? parseFloat(val.toFixed(3)) : String(val));
    }
    outputEl.classList.remove('final-result');
    outputEl.classList.add('preview-result');
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
outputEl.classList.remove('final-result');
outputEl.classList.add('preview-result');
