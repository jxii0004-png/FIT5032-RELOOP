import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendar, summarizePlans, validatePlan, validDate } from '../src/services/planning.js';
import { scoreQuiz } from '../src/data/recyclingQuiz.js';
const stamp = (value) => ({ toDate: () => new Date(value) });
const plan = { itemId: 2, quantity: 3, method: 'reuse', date: '2026-10-17', location: 'Test location' };

test('reject invalid plans and impossible calendar dates', () => {
  assert.equal(validatePlan(plan), '');
  for (const change of [{quantity:0}, {quantity:1.5}, {quantity:1001}, {itemId:99}, {method:'landfill'}, {date:'2026-02-30'}, {location:'x'.repeat(201)}]) assert.notEqual(validatePlan({...plan,...change}), '');
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2027-02-29'), false);
});

test('statistics count quantities only from completed plans and use Sydney month', () => {
  const rows = [
    {...plan, status:'completed',completedAt:stamp('2026-09-30T14:30:00Z')},
    {...plan, itemId:3,method:'recycle',quantity:2,status:'completed',completedAt:stamp('2026-09-30T12:00:00Z')},
    {...plan,quantity:99,status:'planned',completedAt:null},
    {...plan,status:'completed',completedAt:null},
  ];
  assert.equal(summarizePlans(rows).quantity, 5);
  const october = summarizePlans(rows, '2026-10');
  assert.equal(october.tasks, 1);
  assert.equal(october.quantity, 3);
  assert.deepEqual(october.byMethod, {reuse:3,repair:0,recycle:0});
  assert.deepEqual(october.categories, {'Electronic waste':3});
  assert.equal(summarizePlans(rows.filter(row => row !== rows[0])).quantity, 2);
  assert.equal(summarizePlans([{...rows[0],quantity:7}]).quantity, 7);
});

test('calendar excludes completed and unscheduled plans, handles year and leap-day boundaries', () => {
  const result = createCalendar([
    {...plan,id:'one',date:'2026-12-31',status:'planned'},
    {...plan,id:'two',date:'2028-02-29',status:'planned'},
    {...plan,id:'done',status:'completed'},
    {...plan,id:'no-date',date:'',status:'planned'},
  ], new Date('2026-10-16T02:00:00Z'));
  assert.equal((result.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(result.includes('DTEND;VALUE=DATE:20270101\r\n'));
  assert.ok(result.includes('DTEND;VALUE=DATE:20280301\r\n'));
  assert.ok(result.includes('DTSTAMP:20261016T020000Z'));
  assert.ok(result.includes('TRIGGER:-P1D'));
  assert.ok(!result.includes('UID:done@'));
});

test('calendar escapes text and folds Unicode lines at 75 UTF-8 bytes', () => {
  const location = '学校, Centre; Building\\Room\nBEGIN:VEVENT ' + '中文'.repeat(90);
  const result = createCalendar([{...plan,id:'safe',status:'planned',location}]);
  for (const line of result.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
  const unfolded = result.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('学校\\, Centre\\; Building\\\\Room\\nBEGIN:VEVENT'));
  assert.equal((result.match(/\r\nBEGIN:VEVENT\r\n/g) || []).length, 1);
});

test('quiz scores correct, wrong and unanswered answers', () => {
  assert.equal(scoreQuiz([1,0,2,1,0]), 5);
  assert.equal(scoreQuiz([0,1,0,0,1]), 0);
  assert.equal(scoreQuiz(['','','','','']), 0);
  assert.equal(scoreQuiz([]), 0);
});
