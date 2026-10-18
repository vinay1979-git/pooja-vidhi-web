import React from 'react';
import { notFound } from 'next/navigation';
import { PoojaViewer } from '@/components/PoojaViewer';
import { getPooja, getSteps, getGotras } from '@/lib/queries';

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

  // A planned rite has a catalogue card but no steps. The catalogue does not
  // link it, and the URL must not open it either: the viewer would render a
  // preparation screen and a Begin button for a rite with nothing to begin.
  if (!pooja || pooja.status === 'planned') notFound();

  // Only a rite whose mantra asks for the reader's gotra loads the table.
  const gotras = steps.some((s) => s.mantra_sanskrit?.includes('[GOTRA]'))
    ? await getGotras()
    : [];

  return (
    <div className="relative min-h-screen bg-stone-950">
      <PoojaViewer pooja={pooja} steps={steps} gotras={gotras} />
    </div>
  );
}
