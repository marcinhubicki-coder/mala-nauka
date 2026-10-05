import {validateConfig} from './model.mjs';
import {validateAssets} from './validation.mjs';
import {validateRules} from '../shared/rules-library.mjs';
import {validateBatches} from './batch-model.mjs';
import {planStudioMerge} from './merge-model.mjs';

export function draftRecovery(draft,remote){
  if(!draft||draft.schemaVersion!==1||!draft.config)return null;
  validateConfig(draft.config);
  if(draft.baseRevision===remote.config.revision)return {kind:'current'};
  const local={config:draft.config,assets:draft.assets||remote.assets,rules:draft.rules||remote.rules,batches:draft.batches||remote.batches};
  validateAssets(local.assets);validateRules(local.rules);validateBatches(local.batches);
  if(!draft.baseState)return {kind:'legacy',local};
  const base=draft.baseState;validateConfig(base.config);validateAssets(base.assets);validateRules(base.rules);validateBatches(base.batches);
  return {kind:'merge',local,plan:planStudioMerge(base,local,remote)};
}
