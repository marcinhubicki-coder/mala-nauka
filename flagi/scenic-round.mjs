import {cleanRoundSettings} from '../spelling/round.mjs';
export function configureScenicRound(session,config){
 const round=cleanRoundSettings(config);session.untimed=round.limitMode==='count';session.questionLimit=session.untimed?round.wordLimit:0;
}
