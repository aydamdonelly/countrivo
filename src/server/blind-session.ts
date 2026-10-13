import "server-only";

import { gameModule, type BlindPickState } from "@/games/blind-pick/module";

export const blindRemote = { ...gameModule, feedback: undefined };

export function blindView(state:BlindPickState):BlindPickState {
  const full=state.g.placements.length===6;
  if(full)return state;
  const cfg=state.g.config,placed=state.g.placements.length;
  return {...state,g:{...state.g,config:{...cfg,
    countries:cfg.countries.map((c,i)=>i<=placed?c:{iso2:'',iso3:'',name:'',displayName:'',slug:'',region:'',subregion:'',continent:'',flagSvgPath:'',capital:'',borders:[]}),
    costMatrix:cfg.costMatrix.map((row,i)=>i<placed?row:row.map(()=>0)),optimalScore:0,optimalAssignment:[],greedyScore:0,
  }}};
}
