import { ImageResponse } from "next/og";
import { clayOg } from "@/lib/data/loader";
import { TABLE_GAMES } from "@/content/table";
import { getGameContent } from "@/content/games";
import { getAllCountries } from "@/lib/data/countries";
import { getAllGames, getGameBySlug } from "@/lib/data/registry";
import { erodeFontData } from "./erode-font";

/** Satori cannot resolve CSS custom properties. These constants mirror tokens.css. */
export const PAPER = "#fbfaf6"; /* --color-paper */
export const CARD = "#f1f0ea"; /* --color-card */
export const INK = "#17181a"; /* --color-ink */
export const INK_2 = "#2b2c2e"; /* --color-ink-2 */
export const INK_MUTED = "#6a6b65"; /* --color-mute */
export const INK_FAINT = "#b9b8b1"; /* --color-faint */
export const EMBER = "#b8432a"; /* --color-ember */
export const ON_INK = "#fbfaf6"; /* --color-on-ink */
export const ON_INK_BODY = "#c9c8c1"; /* --color-on-ink-body */
export const ON_INK_KICKER = "#a9aaa3"; /* --color-on-ink-kicker */
export const ON_INK_CHIP = "#d9d8d1"; /* --color-on-ink-chip */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

let erode: ArrayBuffer | null = null;
function erodeFont(): ArrayBuffer {
  if (!erode) erode = erodeFontData();
  return erode;
}

export interface GameOgProps {
  /** The daily, practice or shared-result label. */
  kicker: string;
  /** Right half of the kicker row: "resets at midnight Berlin". */
  counter: string;
  /** The card headline, Erode. */
  title: string;
  /** The one-line rule under the headline. */
  how: string;
  /** Two or three facts as chips; they sit beside the button. */
  chips: string[];
  /** The paper button in the card's bottom-right corner; null for a card with no action. */
  cta: string | null;
}

/** The light tray and clay object mirror the October game-card composition. */
export async function renderGameOgImage({ kicker, counter, title, how, chips, cta }: GameOgProps): Promise<ImageResponse> {
  const presentation = TABLE_GAMES.find(game => game.title === title);
  const object = clayOg[presentation?.slug ?? 'globe'];
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:PAPER,color:INK,fontFamily:'Erode',padding:'40px 64px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><div style={{fontSize:40}}>Countrivo</div><div style={{fontSize:24,color:INK_MUTED}}>countrivo.com</div></div>
      <div style={{position:'relative',display:'flex',flexDirection:'column',marginTop:64,padding:'40px 48px',borderRadius:16,background:CARD,flex:1}}>
        <div style={{position:'absolute',right:24,top:-48,width:230,height:128,display:'flex',justifyContent:'center',background:PAPER,borderRadius:16}}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori receives an embedded local PNG */}
          <img src={object} alt="" width={200} height={200} style={{position:'absolute',top:-24}} />
        </div>
        <div style={{display:'flex',color:INK_MUTED,fontSize:22}}>{kicker}</div>
        <div style={{display:'flex',fontSize:title.length>20?68:80,lineHeight:1.06,marginTop:24,maxWidth:720}}>{title}</div>
        <div style={{display:'flex',fontSize:28,lineHeight:1.35,marginTop:22,maxWidth:750}}>{how}</div>
        <div style={{display:'flex',gap:24,color:INK_MUTED,fontSize:22,marginTop:'auto',paddingTop:24}}>{chips.slice(0,2).map(chip=><span key={chip}>{chip}</span>)}</div>
        {cta?<div style={{position:'absolute',right:32,bottom:-20,display:'flex',background:INK,color:PAPER,padding:'18px 40px',borderRadius:8,fontSize:30}}>{cta}</div>:null}
      </div>
      <div style={{display:'flex',fontSize:22,color:INK_MUTED,marginTop:38}}>{counter}</div>
    </div>,
    {...ogSize,fonts:[{name:'Erode',data:erodeFont(),weight:600,style:'normal'}]},
  );
}

interface SlugOgOptions {
  /** Overrides the kicker's first half: "Daily board" / "Practice" / "Shared result". */
  badge?: string;
  /** Overrides the kicker's right half. */
  counter?: string;
  /** Overrides the one-line rule. */
  shortDescription?: string;
}

/**
 * Registry-driven entry point used by the landing and run OG routes.
 * Unknown slugs degrade to the brand card instead of throwing.
 */
export function renderGameOgImageForSlug(
  slug: string,
  options: SlugOgOptions = {}
): Promise<ImageResponse> {
  const game = getGameBySlug(slug);

  if (!game) {
    return renderGameOgImage({
      kicker: (options.badge ?? "Geography games"),
      counter: options.counter ?? "one shot a day",
      title: "Countrivo",
      how:
        options.shortDescription ??
        "Free geography games. One shot a day, same board for everyone.",
      chips: [`${getAllGames().length} games`, `${getAllCountries().length} countries`],
      cta: "Play",
    });
  }

  const isDaily = game.availableModes.includes("daily");
  const presentation = TABLE_GAMES.find(item => item.slug === slug);
  const content = getGameContent(slug);
  return renderGameOgImage({
    kicker: options.badge ?? (isDaily ? 'Daily board' : 'Practice'),
    counter: options.counter ?? (isDaily ? 'Same board for everyone · midnight Berlin reset' : 'Fresh boards · unlimited practice'),
    title: game.title,
    how: options.shortDescription ?? presentation?.promise ?? game.shortDescription,
    chips: presentation ? [presentation.minutes, `Par ${presentation.par}`] : content ? [...content.facts] : [],
    cta: game.comingSoon ? null : 'Play',
  });
}
