import assert from 'node:assert/strict';
import test from 'node:test';
import { run, _test } from '../src/cli.js';

function capture() {
  const logs=[]; const errors=[];
  return { io:{log:(x)=>logs.push(String(x)),error:(x)=>errors.push(String(x)),warn:(x)=>errors.push(String(x))},logs,errors };
}

test('unknown command option is rejected instead of becoming positional', async () => {
  const {io,errors}=capture();
  const code=await run(['buy','x','1','--yse','--base-url','http://127.0.0.1:1'],io,{isTTY:false});
  assert.equal(code,1);
  assert.match(errors.join('\n'),/Unknown option|不明なオプション/);
});

test('printResult output is captured through injected io', async () => {
  const {io,logs}=capture();
  const client={ prices:async()=>({token:'secret-token',value:1}) };
  const code=await run(['prices'],io,{isTTY:false},{clientOverride:client,globalOverride:{json:true,jsonl:false,compact:false,noColor:true,revealSecrets:false,lang:'en'}});
  assert.equal(code,0);
  assert.equal(JSON.parse(logs[0]).token,'secret-token');
});

test('buy prompts on TTY and proceeds after yes', async () => {
  const {io}=capture(); let bought=false;
  const client={ buy:async(account,amount)=>{bought=account==='prod'&&amount===2;return {ok:true};} };
  const code=await run(['buy','prod','2'],io,{isTTY:true,prompt:async()=> 'yes'},{clientOverride:client,globalOverride:{json:false,jsonl:false,compact:false,noColor:true,revealSecrets:false,lang:'en'}});
  assert.equal(code,0); assert.equal(bought,true);
});

test('buy requires --yes when non-interactive', async () => {
  const {io,errors}=capture();
  const client={ buy:async()=>({ok:true}) };
  const code=await run(['buy','prod','2'],io,{isTTY:false},{clientOverride:client,globalOverride:{json:false,jsonl:false,compact:false,noColor:true,revealSecrets:false,lang:'en'}});
  assert.equal(code,1); assert.match(errors.join('\n'),/--yes/);
});

test('watch emits heartbeat even when status signature is unchanged', async () => {
  let calls=0; const outputs=[]; let now=0;
  const client={ taskStatus:async()=>{calls+=1;return calls>=3?{status:'completed'}:{status:'running'};} };
  await _test.waitForJob(client,'job',10,(v)=>outputs.push(v),{heartbeatMs:60_000,now:()=>{now+=60_000;return now;},sleepImpl:async()=>{}});
  assert.equal(outputs.length,3);
});

test('extra positional arguments are rejected', async () => {
  const {io,errors}=capture(); const client={prices:async()=>[]};
  const code=await run(['prices','oops'],io,{isTTY:false},{clientOverride:client,globalOverride:{json:false,jsonl:false,compact:false,noColor:true,revealSecrets:false,lang:'en'}});
  assert.equal(code,1); assert.match(errors.join('\n'),/Unexpected argument|余分な引数/);
});
