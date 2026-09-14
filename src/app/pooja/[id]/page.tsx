import React from 'react';
import { notFound } from 'next/navigation';
import { PoojaViewer } from '@/components/PoojaViewer';
import { getPooja, getSteps } from '@/lib/queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PoojaDetailPage({ params }: PageProps) {
  const { id: poojaId } = await params;

  // No try/catch and no local fallback. The previous version swallowed every
  // database error and served the hardcoded catalogue instead, which is why a
  // completely unconfigured Supabase looked like a working app and 18 seeded
  // steps rendered as 6. A real failure should now surface.
  const [pooja, steps] = await Promise.all([getPooja(poojaId), getSteps(poojaId)]);

  if (!pooja) notFound();

  return (
    <div className="relative min-h-screen bg-stone-950">
      <PoojaViewer pooja={pooja} steps={steps} />
    </div>
  );
}
