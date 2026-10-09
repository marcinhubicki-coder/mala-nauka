import {assetManifest,assetUrl} from '../shared/asset-loader.mjs';

// All word → illustration assignments belong to design-system/assets.json.
export function sceneFor(masked,word='') {
  const assignment=assetManifest().words[word];
  if(!assignment)return null;
  return {key:assignment.key||assignment.path.split('/').at(-1).replace(/\.[^.]+$/,''),asset:assignment.path,layouts:['bubble']};
}
export function chooseLayout(){return 'bubble';}
export function sceneUrl(scene){return scene?assetUrl(scene.asset):'';}
