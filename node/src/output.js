const SENSITIVE_KEYS = new Set(['token','tokens','item_data','authorization','api_token','password','pass']);
const ANSI = { bold:'\x1b[1m', cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', reset:'\x1b[0m' };
function mask(value){ const text=String(value); if(text.length<=8)return '<redacted>'; return `${text.slice(0,3)}…${text.slice(-3)}`; }
export function sanitize(value,{revealSecrets=false,key=''}={}){ if(revealSecrets)return value; if(SENSITIVE_KEYS.has(String(key).toLowerCase())){ if(Array.isArray(value))return `<redacted ${value.length} item(s)>`; return mask(value); } if(Array.isArray(value))return value.map((item)=>sanitize(item)); if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sanitize(v,{key:k})])); return value; }
function paint(text, code, noColor){ return noColor?String(text):`${code}${text}${ANSI.reset}`; }
function scalar(v){ return typeof v==='object'&&v!==null?JSON.stringify(v):String(v); }
function progressLine(obj,noColor){
  const done=Number(obj?.delivered ?? obj?.boosts_delivered ?? obj?.humanized ?? 0);
  const total=Number(obj?.total ?? obj?.quantity ?? obj?.boosts ?? 0);
  if(!Number.isFinite(done)||!Number.isFinite(total)||total<=0)return null;
  const ratio=Math.max(0,Math.min(1,done/total)); const width=20; const n=Math.round(ratio*width);
  return `${paint('progress',ANSI.cyan,noColor)}: [${'#'.repeat(n)}${'-'.repeat(width-n)}] ${done}/${total}`;
}
export function printResult(value,{json=false,jsonl=false,compact=false,revealSecrets=false,noColor=false}={},io=console){
  if(json||jsonl||compact){ io.log(JSON.stringify(value,null,(compact||jsonl)?0:2)); return; }
  const safe=sanitize(value,{revealSecrets});
  if(Array.isArray(safe)){ safe.forEach((item,index)=>{ if(item&&typeof item==='object'){ io.log(paint(`┌─ ${index+1}. ${item.title??item.product??item.id??'item'}`,ANSI.bold,noColor)); for(const [k,v] of Object.entries(item))io.log(`│ ${paint(k,ANSI.cyan,noColor)}: ${scalar(v)}`); io.log('└─'); } else io.log(`${index+1}. ${item}`); }); return; }
  if(safe&&typeof safe==='object'){ io.log(paint('┌─ Result',ANSI.bold,noColor)); for(const [k,v] of Object.entries(safe))io.log(`│ ${paint(k,ANSI.cyan,noColor)}: ${scalar(v)}`); const p=progressLine(safe,noColor); if(p)io.log(`│ ${p}`); io.log('└─'); return; }
  io.log(String(safe));
}
