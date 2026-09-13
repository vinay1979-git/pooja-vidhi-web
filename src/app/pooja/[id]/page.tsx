import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PoojaViewer } from '@/components/PoojaViewer';
import { TempleBell } from '@/components/TempleBell';
import { Pooja, PoojaStep } from '@/types/pooja';
import { MASTER_POOJAS, MASTER_POOJA_STEPS } from '@/data/catalog';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PoojaDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const poojaId = resolvedParams.id;

  let pooja: Pooja | null = null;
  let steps: PoojaStep[] = [];

  try {
    // 1. Fetch Pooja details from Supabase
    const { data: poojaData, error: poojaError } = await supabase
      .from('poojas')
      .select('*')
      .eq('id', poojaId)
      .single();

    if (!poojaError && poojaData) {
      pooja = poojaData as Pooja;

      // 2. Fetch steps for this pooja
      const { data: stepsData, error: stepsError } = await supabase
        .from('pooja_steps')
        .select('*')
        .eq('pooja_id', poojaId)
        .order('step_number', { ascending: true });

      if (!stepsError && stepsData && stepsData.length > 0) {
        steps = stepsData as PoojaStep[];
      }
    }
  } catch (e) {
    console.warn(`Supabase lookup error for ${poojaId}:`, e);
  }

  // Fallback to local catalog if database query returned no records
  if (!pooja) {
    pooja = MASTER_POOJAS.find((p) => p.id === poojaId) || null;
  }

  if (!pooja) {
    notFound();
  }

  if (!steps || steps.length === 0) {
    steps = MASTER_POOJA_STEPS[poojaId] || MASTER_POOJA_STEPS['ganesha_standard'] || [];
  }

  return (
    <div className="relative min-h-screen bg-stone-950">
      <PoojaViewer pooja={pooja} steps={steps} />
      <TempleBell />
    </div>
  );
}
