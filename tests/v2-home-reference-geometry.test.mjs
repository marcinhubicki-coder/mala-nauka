import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_TILES,HOME_WIDTH,HOME_TOP,HOME_CONTENT_HEIGHT} from '../shared/home-layout.mjs';

const screenshot={cssWidth:390,cssHeight:844,pixelWidth:946,safeTop:47,safeBottom:34};
function screenshotOrigin(rect){
 const [x,y]=rect,ratio=screenshot.pixelWidth/screenshot.cssWidth;
 const canvasHeight=screenshot.cssHeight-screenshot.safeTop-screenshot.safeBottom;
 return {
  x:x/HOME_WIDTH*screenshot.cssWidth*ratio,
  y:(screenshot.safeTop+(y-HOME_TOP)/HOME_CONTENT_HEIGHT*canvasHeight)*ratio
 };
}
test('Home approved five mode cards retain their 3 + 2 geometry',()=>{
 const expected={
  spelling:[37,1389],math:[334,1386],english:[628,1386],
  flags:[37,1671],reading:[482,1671]
 };
 for(const [mode,[x,y]]of Object.entries(expected)){
  const actual=screenshotOrigin(HOME_TILES[mode]);
  assert.ok(Math.abs(actual.x-x)<20,mode+' x');
  assert.ok(Math.abs(actual.y-y)<20,mode+' y');
 }
 assert.equal(HOME_TILES.spelling[1],HOME_TILES.math[1]);
 assert.equal(HOME_TILES.math[1],HOME_TILES.english[1]);
 assert.equal(HOME_TILES.flags[1],HOME_TILES.reading[1]);
 assert.ok(HOME_TILES.flags[1]>HOME_TILES.spelling[1]);
});
