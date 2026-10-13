import type { Metadata } from 'next';
import { SiteFoot } from '@/ui/site-foot';
export const metadata:Metadata={title:'Imprint'};
export default function Imprint(){return <><div className="system-page"><h1 className="t-h1">Imprint</h1><section><h2 className="t-h2">Operator</h2><p className="t-body">Adam Kahirov<br/>Lily-Braun-Straße 27<br/>12619 Berlin<br/>Germany</p></section><section><h2 className="t-h2">Contact</h2><p className="t-body"><a href="mailto:countrivo@gmail.com">countrivo@gmail.com</a></p></section><section><h2 className="t-h2">Editorial responsibility</h2><p className="t-body">Adam Kahirov, at the address above.</p></section></div><SiteFoot /></>;}
