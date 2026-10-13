export interface CapitalOverride {accepted:readonly string[];question:string;explanation:string;sourceUrl:string;sourceLabel:string}
export const CAPITAL_OVERRIDES:Readonly<Record<string,CapitalOverride>>={
  ZAF:{accepted:['Pretoria','Cape Town','Bloemfontein'],question:'Pick one of its capitals.',explanation:'South Africa has three capitals: Pretoria is administrative, Cape Town legislative, and Bloemfontein judicial.',sourceUrl:'https://www.gov.za/about-sa/south-africas-provinces',sourceLabel:'South African Government'},
  BOL:{accepted:['Sucre','La Paz'],question:'Pick its constitutional capital or seat of government.',explanation:'Sucre is Bolivia’s constitutional capital. La Paz is the seat of government. Either answer counts here.',sourceUrl:'https://cancilleria.gob.bo/mre/acerca-del-ministerio/',sourceLabel:'Bolivian Ministry of Foreign Affairs'},
};
export const DISPUTED_CAPITAL_COUNTRIES:readonly string[]=['ISR','PSE'];
