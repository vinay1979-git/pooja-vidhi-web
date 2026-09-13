import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Pooja } from '@/types/pooja';
import { MASTER_POOJAS } from '@/data/catalog';
import { TempleBell } from '@/components/TempleBell';
import { Sparkles, Flame, Clock, ArrowRight, BookOpen, Compass, Search } from 'lucide-react';

export default async function CatalogHomePage() {
  let poojasList: Pooja[] = MASTER_POOJAS;

  try {
    const { data, error } = await supabase.from('poojas').select('*');
    if (!error && data && data.length > 0) {
      // Merge database items with local master catalog items
      const dbIds = new Set(data.map((p) => p.id));
      const extraLocal = MASTER_POOJAS.filter((p) => !dbIds.has(p.id));
      poojasList = [...(data as Pooja[]), ...extraLocal];
    }
  } catch (e) {
    console.warn('Supabase fetch for poojas list failed:', e);
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950 pb-20">
      {/* Top Divine Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-lg shadow-amber-600/30">
              <Flame className="w-6 h-6 fill-stone-950" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-wide">
                Pooja Vidhi (பூஜை விதிகள்)
              </h1>
              <p className="text-xs text-amber-400/80 font-medium">
                Sacred Guided Rituals & Dynamic Sankalpam Companion
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-amber-300">
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auspicious Panchangam Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-10">
        {/* Sacred Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-950 border border-amber-500/30 p-8 md:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400" /> Sacred Rituals & Mantras Storehouse
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-amber-100 leading-tight">
              Perform Authentic Hindu Poojas with Confidence & Devotion
            </h2>
            <p className="text-stone-300 text-base md:text-lg leading-relaxed">
              Step-by-step guided Vidhis, authentic Devanagari & Tamil script mantras, audio temple bell chime, personalized Sankalpam generator, and full philosophical explanations for every ritual.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-300">
              <span className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Compass className="w-4 h-4 text-amber-400" /> Geolocation Sankalpam
              </span>
              <span className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <BookOpen className="w-4 h-4 text-amber-400" /> 108 Namavali Archana
              </span>
              <span className="flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" /> Gender & Novice Adaptations
              </span>
            </div>
          </div>
        </section>

        {/* Catalog Search & Grid Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
                Pooja Catalog (பூஜை பட்டியல்)
              </h3>
              <p className="text-xs text-stone-400">Select a deity or ritual below to begin step-by-step worship</p>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2 bg-stone-900 px-3 py-2 rounded-xl border border-stone-800">
              <Search className="w-4 h-4 text-amber-400" />
              <input
                type="text"
                placeholder="Search poojas, deities..."
                className="bg-transparent text-xs text-stone-100 focus:outline-none w-full sm:w-48"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poojasList.map((pooja) => (
              <Link
                key={pooja.id}
                href={`/pooja/${pooja.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-950/40"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

                <div className="space-y-4">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      {pooja.deity || 'Deity Puja'}
                    </span>
                    {pooja.duration_mins && (
                      <span className="flex items-center gap-1 text-xs text-stone-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {pooja.duration_mins} mins
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-xl font-extrabold text-stone-100 group-hover:text-amber-300 transition-colors">
                      {pooja.title_en}
                    </h4>
                    {pooja.title_ta && (
                      <p className="text-sm font-semibold text-amber-400/90 mt-0.5">
                        {pooja.title_ta}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                    {pooja.description_en}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-6 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  <span>Begin Vidhi (பூஜை தொடங்கு)</span>
                  <div className="p-2 rounded-lg bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <TempleBell />
    </div>
  );
}
