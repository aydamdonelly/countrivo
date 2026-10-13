import { notFound } from 'next/navigation';
import { getGameBySlug } from '@/lib/data/games';
import { ArchivePage } from '@/features/seo/archive-page';
export const dynamic='force-dynamic';
export default async function Archive({params}: {params:Promise<{slug:string}>}) {const {slug}=await params;if(!getGameBySlug(slug)?.availableModes.includes('daily'))notFound();return <ArchivePage slug={slug} />;}
