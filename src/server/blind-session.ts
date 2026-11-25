import "server-only";

import { gameModule, legacyGameModule, v3GameModule, BLIND_PICK_V3_VERSION, BLIND_PICK_VERSION, type BlindPickState } from "@/games/blind-pick/module";
import { readRunTicket } from "./anonymous-identity";

export const blindRemote = { ...gameModule, feedback: undefined };
const v3Remote = { ...v3GameModule, feedback: undefined };
const legacyRemote = { ...legacyGameModule, feedback: undefined };

/** A signed practice session resumes on the board of the content version it was dealt under. */
export function blindSessionModule(token?: string) {
  const ticket = token ? readRunTicket(token) : null;
  if (ticket?.slug !== "blind-pick" || ticket.mode !== "practice" || ticket.archived || ticket.contentVersion === BLIND_PICK_VERSION) return blindRemote;
  return ticket.contentVersion === BLIND_PICK_V3_VERSION ? v3Remote : legacyRemote;
}

export function blindView(state:BlindPickState):BlindPickState {
  if(state.seen)return state;
  const cfg=state.g.config,placed=state.g.placements.length;
  return {...state,g:{...state.g,config:{...cfg,
    countries:cfg.countries.map((c,i)=>i<=placed?c:{iso2:'',iso3:'',name:'',displayName:'',slug:'',region:'',subregion:'',continent:'',flagSvgPath:'',capital:'',borders:[]}),
    costMatrix:cfg.costMatrix.map((row,i)=>row.map((rank,slot)=>i<placed&&state.g.placements[i]===slot?rank:0)),optimalScore:0,optimalAssignment:[],greedyScore:0,
  }}};
}
