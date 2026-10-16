// Small deterministic offline bootstrap. Other images are cached on first use
// by the service worker and never downloaded en masse during installation.
const essential=new Set([
 'assets/brand/home-adventure-3d.webp',
 'assets/brand/home-mark.png',
 'assets/brand/player-empty-3d.webp',
 'assets/brand/avatars/a.webp',
 'assets/brand/avatars/b.webp',
 'assets/brand/avatars/c.webp',
 'assets/brand/avatars/d.webp',
 'assets/brand/avatars/e.webp',
 'assets/brand/avatars/f.webp',
 'assets/brand/avatars/g.webp',
 'assets/brand/avatars/h.webp',
 'assets/brand/avatars/i.webp',
 'assets/brand/avatars/j.webp',
 'assets/brand/avatars/k.webp',
 'assets/brand/avatars/l.webp',
 'assets/brand/player-logo-3d.webp',
 'assets/ortografia/wizard-meadow-animals-v2.webp',
 'assets/ortografia/wizard-mission-retina-v1.webp',
 'assets/ortografia/game-meadow-v1.webp',
 'assets/ortografia/result-background-v6.webp',
 'assets/angielski/wizard-london-retina-v2.webp',
 'assets/angielski/wizard-mission-retina-v2.webp',
 'assets/czytanie/wizard-park-retina-v1.webp',
 'assets/czytanie/wizard-mission-retina-v1.webp'
]);
export function selectOfflineBootstrapAssets(assets){
 return assets.filter(item=>essential.has(item.path)||/^assets\/fonts\/[^/]+\.woff2?$/.test(item.path)||/^assets\/icons\/.+\.(?:png|webp|svg)$/.test(item.path));
}
export function offlineAssetBudget(assets){
 const bootstrap=selectOfflineBootstrapAssets(assets);
 const bytes=list=>list.reduce((sum,item)=>sum+Number(item.size||0),0);
 return {catalogCount:assets.length,bootstrapCount:bootstrap.length,catalogBytes:bytes(assets),bootstrapBytes:bytes(bootstrap),deferredBytes:bytes(assets)-bytes(bootstrap)};
}
