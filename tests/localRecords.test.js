import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalArray, writeLocalArray, clearLocalArray, validSearchRecord, validRatingRecord } from '../src/services/localRecords.js';
const history = {name:'Mobile Phone',condition:'broken',recommendation:'Use an appropriate collection service.'};
const fakeStorage = (value) => ({getItem:()=>value});
test('malformed history cannot break search or email preparation', () => {
  for (const value of ['null','{}','123','false','"text"','[null,{}]','not json']) assert.deepEqual(readLocalArray('history',validSearchRecord,fakeStorage(value)),[]);
  assert.deepEqual(readLocalArray('history',validSearchRecord,fakeStorage(JSON.stringify([null,history,{...history,condition:'wrong'}]))),[history]);
});
test('invalid cached ratings are ignored rather than corrupting averages', () => {
  const good = {itemId:2,userId:'test-user',score:4};
  const records = [good,null,{...good,score:99},{...good,score:'5'},{...good,userId:null}];
  assert.deepEqual(readLocalArray('ratings',validRatingRecord,fakeStorage(JSON.stringify(records))),[good]);
});
test('unavailable or full browser storage returns failure without throwing', () => {
  const blocked = {getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');},removeItem:()=>{throw new Error('blocked');}};
  assert.deepEqual(readLocalArray('history',validSearchRecord,blocked),[]);
  assert.equal(writeLocalArray('history',[history],blocked),false);
  assert.equal(clearLocalArray('history',blocked),false);
});
