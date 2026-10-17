import test from 'node:test';
import assert from 'node:assert/strict';
import {createCsv,createPrintHtml} from '../src/services/tableExport.js';
const columns=[{key:'name',label:'Name'},{key:'note',label:'Note'}];
test('CSV keeps multiline Unicode cells and neutralises spreadsheet formulas',()=>{
  const csv=createCsv(columns,[{name:'王, "同学"',note:'first\nsecond'},{name:' =SUM(1,2)',note:'@command'}]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"王, ""同学"""'));
  assert.ok(csv.includes('"first\nsecond"'));
  assert.ok(csv.includes('"\' =SUM(1,2)"'));
  assert.ok(csv.includes('"\'@command"'));
});
test('print report escapes markup and includes all exported rows',()=>{
  const rows=Array.from({length:12},(_,index)=>({name:`Item ${index}`,note:'<script>alert(1)</script>'}));
  const html=createPrintHtml('<unsafe>',columns,rows);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;unsafe&gt;'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.equal((html.match(/<td>/g)||[]).length,24);
  assert.ok(html.includes('12 records'));
});
