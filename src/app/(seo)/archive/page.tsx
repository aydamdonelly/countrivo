import type { Metadata } from 'next';
import { ArchivePage } from '@/features/seo/archive-page';
export const dynamic='force-dynamic';
export const metadata: Metadata={title:'Past geography boards'};
export default function Archive(){return <ArchivePage />;}
