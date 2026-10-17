import {homeBadgeSurface,homeDecorationStar} from './home-atoms.mjs';
export const MISSION_SIZE={width:350,height:127,plateHeight:94,overflow:33};
export const MISSION_ASSETS={spelling:'assets/ortografia/wizard-mission-retina-v1.webp',english:'assets/angielski/wizard-mission-retina-v2.webp',reading:'assets/czytanie/wizard-mission-retina-v1.webp',flags:'assets/flags/adventure/mission-v1.webp'};
export function missionIllustration(mode='spelling',assetURL=path=>path){
 const art=MISSION_ASSETS[mode];
 const math=`<rect x="0" y="33" width="350" height="94" rx="24" fill="#e4f5ff"/><g transform="translate(8 22) rotate(-10 50 50)"><svg width="100" height="100" viewBox="0 0 140 140" style="--badge-light:#69cfff;--badge-dark:#258ce9">${homeBadgeSurface('math').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg><text x="48" y="67" text-anchor="middle" fill="white" font-size="43" font-family="var(--ds-font-ui)" font-weight="800">1+2</text></g><g transform="translate(286 0)"><svg width="42" height="42">${homeDecorationStar().replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg></g><text x="302" y="102" fill="#3896ec" font-size="62" font-family="var(--ds-font-ui)" font-weight="800">+</text>`;
 return `<span class="mission-illustration" data-ds-recipe="image-mission" data-ds-kind="image" data-ds-atomic="true" data-ds-key="mission-illustration" data-ds-label="Ilustracja misji" data-mode="${mode}"><svg viewBox="0 0 350 127" preserveAspectRatio="none" aria-hidden="true">${art?`<image href="${assetURL(art)}" width="350" height="127" preserveAspectRatio="none"/>`:math}</svg></span>`;
}
export function normalizeMission(root,mode,assetURL=path=>path){
 const intro=root?.querySelector('.wizard-intro');if(!intro)return;
 for(const old of intro.querySelectorAll('.spelling-mission-art,.english-mission-art,.english-mission-boy,.reading-mission-art,.flag-mission-art,.mode-icon'))old.remove();
 intro.dataset.dsRecipe='container-mission';intro.dataset.dsKey='mission';
 // DOMTokenList.add also emits a class mutation when the token already exists.
 // This function runs inside the design observer, so it must be idempotent.
 if(!intro.classList.contains('mission-card'))intro.classList.add('mission-card');
 if(!intro.querySelector('.mission-illustration'))intro.insertAdjacentHTML('afterbegin',missionIllustration(mode,assetURL));
}
