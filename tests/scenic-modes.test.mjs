import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../game.mjs';
import {FLAGS} from '../data/flags.mjs';
import {flagQuestion} from '../modes.mjs';
import {scenicMode,choiceText,sessionValue} from '../flagi/scenic-modes.mjs';
import {localizedRecord} from '../flagi/scenic-language.mjs';

const options=['pl','fr','ch','is'].map(id=>FLAGS.find(r=>r.id===id));
test('all scenic variants preserve scoring and prepared question identities across rounds',()=>{
 for(const flagGameType of ['flags','countries','capitals']){
  const session=new Session(owner=>flagQuestion(options[owner.question%2],options,{flagGameType},()=>.4,1),180,()=>0);
  session.mode='flags';
  assert.equal(scenicMode(session.current),flagGameType);
  assert(session.answer(sessionValue(options[2],session.current,true)));
  assert.equal(session.wrong,1);
  const next=session.prepareNext();session.next();assert.equal(session.current,next);
  session.options=options.map(record=>sessionValue(record,session.current,true));
  assert(session.answer(sessionValue(options[1],session.current,true)));
  assert.equal(session.correct,1);assert.equal(session.wrong,1);
 }
});
test('capital choices localize independently of the values submitted to Session',()=>{
 const poland=options[0],english=localizedRecord(poland,'en');
 assert.equal(choiceText(english,'capitals'),'Warsaw');
 assert.equal(choiceText(english,'countries'),'Poland');
 assert.equal(sessionValue(poland,{kind:'flag-capital'},true),'Polska');
 assert.equal(sessionValue(poland,{kind:'flag-country'},true),'pl');
});
