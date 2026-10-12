import {StudioBlocksV2} from './studio-blocks-v2.mjs';
// V2 is exclusively the production block library. Mock builders are not shown.
export class StudioBuilder {
 constructor(options){Object.assign(this,options);this.liveRecipes=new StudioBlocksV2(this);this.workspace.addEventListener('click',e=>this.liveRecipes.handle(e));this.workspace.addEventListener('input',e=>this.liveRecipes.handle(e));this.workspace.addEventListener('change',e=>this.liveRecipes.handle(e));}
 render(){this.liveRecipes.render();}
 leave(){this.liveRecipes.leave();}
 importBlueprint(){this.notice('Wybierz rzeczywisty klocek z ekranu w bibliotece v2.');this.render();}
}
