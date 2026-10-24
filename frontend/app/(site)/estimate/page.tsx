import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { EstimateWizard } from '@/components/site/EstimateWizard';

export const metadata: Metadata = {
  title: 'Get an Estimate',
  description: 'Tell us about your roofing or remodeling project in a few steps and attach photos if you have them.',
};

export default async function EstimatePage({ searchParams }: { searchParams: { type?: string } }) {
  const site = await getSite();
  const t = typeof searchParams.type === 'string' ? searchParams.type : '';
  return <EstimateWizard site={site} initialType={t === 'roofing' || t === 'remodeling' ? t : ''} />;
}
