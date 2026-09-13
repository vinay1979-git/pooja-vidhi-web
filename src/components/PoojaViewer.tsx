'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  BookOpen,
  Languages,
  Utensils,
  Flower2,
  Award,
  Flame,
  Check,
  Globe,
  Info,
  Calendar,
  MapPin,
  User,
  Compass,
  Loader2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import { Pooja, PoojaStep, ArchanaItem } from '@/types/pooja';
import { fetchPanchangamData, PanchangamData } from '@/actions/getSankalpam';

interface PoojaViewerProps {
  pooja: Pooja;
  steps: PoojaStep[];
}

export const PoojaViewer: React.FC<PoojaViewerProps> = ({ pooja, steps }) => {
  // Navigation & Language States
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = Samagri / Prep
  const [instructionLang, setInstructionLang] = useState<'en' | 'ta'>('en');
  const [mantraLang, setMantraLang] = useState<'sanskrit' | 'tamil' | 'translit'>('sanskrit');
  const [direction, setDirection] = useState<number>(1);

  // Performer Gender State ('male' | 'female' | 'couple')
  const [performerGender, setPerformerGender] = useState<'male' | 'female' | 'couple'>('male');

  // Philosophy Accordion Toggle State
  const [showPhilosophy, setShowPhilosophy] = useState<boolean>(true);

  // Preparation Checklist State
  const [checkedSamagri, setCheckedSamagri] = useState<Record<string, boolean>>({});

  // Sankalpam Configuration State
  const [sankalpamDate, setSankalpamDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sankalpamData, setSankalpamData] = useState({
    devoteeName: 'Devotee',
    gotra: 'Kashyapa',
    place: 'Chennai, TN',
    lat: 13.0827,
    lon: 80.2707,
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [panchangamData, setPanchangamData] = useState<PanchangamData | null>(null);

  // Archana Progress State
  const [archanaProgress, setArchanaProgress] = useState<Record<string, number>>({});

  // Pooja Complete Summary State
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch Panchangam Data from Server Action
  const loadPanchangam = useCallback(async () => {
    try {
      const data = await fetchPanchangamData(
        sankalpamDate,
        sankalpamData.lat,
        sankalpamData.lon
      );
      setPanchangamData(data);
    } catch (e) {
      console.error('Failed to load Panchangam data:', e);
    }
  }, [sankalpamDate, sankalpamData.lat, sankalpamData.lon]);

  useEffect(() => {
    loadPanchangam();
  }, [loadPanchangam]);

  // Geolocation detection handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus('Detecting coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setSankalpamData((prev) => ({
          ...prev,
          lat,
          lon,
          place: `Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`,
        }));
        setIsDetectingLocation(false);
        setLocationStatus('Location detected successfully!');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsDetectingLocation(false);
        setLocationStatus('Location access denied. Using manual fallback.');
      },
      { timeout: 10000 }
    );
  };

  // Helper to check if step is allowed for current performerGender
  const isStepAvailableForGender = useCallback(
    (step: PoojaStep) => {
      if (!step.gender_target || step.gender_target === 'all' || performerGender === 'couple') {
        return true;
      }
      return step.gender_target === performerGender;
    },
    [performerGender]
  );

  // Filtered steps available for active gender selection
  const availableSteps = useMemo(() => {
    return steps.filter(isStepAvailableForGender);
  }, [steps, isStepAvailableForGender]);

  // Parse Samagri items consistently
  const parsedSamagriList = useMemo(() => {
    return (pooja.samagri_list || []).map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `samagri-${idx}`, item_en: item, item_ta: item, required: true };
      }
      return {
        id: `samagri-${idx}`,
        item_en: item.item_en || '',
        item_ta: item.item_ta || item.item_en || '',
        quantity: item.quantity,
        required: item.required ?? true,
      };
    });
  }, [pooja.samagri_list]);

  // Parse Naivedyam items consistently
  const parsedNaivedyamList = useMemo(() => {
    return (pooja.naivedyam_suggestions || []).map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `naivedyam-${idx}`, name_en: item, name_ta: item };
      }
      return {
        id: `naivedyam-${idx}`,
        name_en: item.name_en,
        name_ta: item.name_ta || item.name_en,
        description_en: item.description_en,
        description_ta: item.description_ta,
      };
    });
  }, [pooja.naivedyam_suggestions]);

  // Toggle Samagri check
  const toggleSamagri = (id: string) => {
    setCheckedSamagri((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkAllSamagri = () => {
    const allChecked: Record<string, boolean> = {};
    parsedSamagriList.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedSamagri(allChecked);
  };

  const resetSamagri = () => {
    setCheckedSamagri({});
  };

  const samagriCompletedCount = useMemo(() => {
    return parsedSamagriList.filter((item) => checkedSamagri[item.id]).length;
  }, [parsedSamagriList, checkedSamagri]);

  // Handle Step Navigation with Gender-aware skipping
  const goToStep = async (newIndex: number) => {
    if (newIndex >= 0 && !panchangamData) {
      await loadPanchangam();
    }
    setDirection(newIndex > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(newIndex);
    if (isCompleted) setIsCompleted(false);
  };

  const handleNextStep = () => {
    if (currentStepIndex === -1) {
      // Find first valid step
      const firstValidIdx = steps.findIndex(isStepAvailableForGender);
      goToStep(firstValidIdx >= 0 ? firstValidIdx : 0);
      return;
    }

    // Find next valid step index
    let nextIdx = currentStepIndex + 1;
    while (nextIdx < steps.length && !isStepAvailableForGender(steps[nextIdx])) {
      nextIdx++;
    }

    if (nextIdx < steps.length) {
      goToStep(nextIdx);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex <= 0) {
      goToStep(-1);
      return;
    }

    let prevIdx = currentStepIndex - 1;
    while (prevIdx >= 0 && !isStepAvailableForGender(steps[prevIdx])) {
      prevIdx--;
    }

    if (prevIdx >= 0) {
      goToStep(prevIdx);
    } else {
      goToStep(-1);
    }
  };

  const currentStep = steps[currentStepIndex];

  // Dynamic Mantra Inserter Helper for Sankalpam
  const getDynamicMantra = useCallback(
    (originalText: string | null | undefined, script: 'sanskrit' | 'tamil' | 'translit') => {
      if (!originalText) return '';
      if (!panchangamData) return originalText;

      const p = panchangamData;
      let dynamicText = '';

      if (script === 'sanskrit') {
        dynamicText = `${p.samvatsara.sanskrit} ${p.ayana.sanskrit} ${p.ritu.sanskrit} ${p.masa.sanskrit} ${p.paksha.sanskrit} ${p.tithi.sanskrit} ${p.vasara.sanskrit} ${p.nakshatra.sanskrit} नक्षत्र युक्तायाम्, ${sankalpamData.gotra || 'काश्यप'} गोत्रोत्भवस्य ${sankalpamData.devoteeName || 'भक्त'} नामधेयस्य`;
      } else if (script === 'tamil') {
        dynamicText = `${p.samvatsara.tamil}, ${p.ayana.tamil}, ${p.ritu.tamil}, ${p.masa.tamil}, ${p.paksha.tamil}, ${p.tithi.tamil}, ${p.vasara.tamil}, ${p.nakshatra.tamil}, ${sankalpamData.gotra || 'காஸ்யப'} கோத்ரத்து ${sankalpamData.devoteeName || 'பக்தர்'} அவர்களுக்கு`;
      } else {
        dynamicText = `${p.samvatsara.translit}, ${p.ayana.translit}, ${p.ritu.translit}, ${p.masa.translit}, ${p.paksha.translit}, ${p.tithi.translit}, ${p.vasara.translit}, ${p.nakshatra.translit}, ${sankalpamData.gotra || 'Kashyapa'} Gotra ${sankalpamData.devoteeName || 'Devotee'}`;
      }

      if (originalText.includes('[DYNAMIC_PANCHANGAM_DATA]')) {
        return originalText.replace('[DYNAMIC_PANCHANGAM_DATA]', dynamicText);
      }
      if (originalText.includes('[DYNAMIC_SANKALPAM]')) {
        return originalText.replace('[DYNAMIC_SANKALPAM]', dynamicText);
      }

      return originalText;
    },
    [panchangamData, sankalpamData]
  );

  // Slide Animation Variants for Framer Motion
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 pb-24">
      {/* Top Banner / Sacred Header */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Title in English and Tamil */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToStep(-1)}
              className="p-2 rounded-lg bg-stone-800 hover:bg-amber-900/40 text-amber-400 transition-colors border border-amber-500/20"
              title="Return to Preparation"
            >
              <Flame className="w-5 h-5 fill-amber-500/30" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-wide">
                {pooja.title_en}
              </h1>
              <p className="text-xs md:text-sm text-amber-400/90 font-medium tracking-wide">
                {pooja.title_ta}
              </p>
            </div>
          </div>

          {/* Language Controls */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Instruction Lang Toggle */}
            <div className="flex items-center bg-stone-950 rounded-lg p-1 border border-stone-800">
              <span className="px-2 text-stone-400 flex items-center gap-1 font-medium">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Instruction:</span>
              </span>
              <button
                onClick={() => setInstructionLang('en')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  instructionLang === 'en'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setInstructionLang('ta')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  instructionLang === 'ta'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Mantra Script Toggle */}
            <div className="flex items-center bg-stone-950 rounded-lg p-1 border border-stone-800">
              <span className="px-2 text-stone-400 flex items-center gap-1 font-medium">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mantra:</span>
              </span>
              <button
                onClick={() => setMantraLang('sanskrit')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mantraLang === 'sanskrit'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                संस्कृतम्
              </button>
              <button
                onClick={() => setMantraLang('tamil')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mantraLang === 'tamil'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setMantraLang('translit')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mantraLang === 'translit'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Eng
              </button>
            </div>
          </div>
        </div>

        {/* Step Progress Bar */}
        {steps.length > 0 && (
          <div className="w-full bg-stone-950 h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 h-full transition-all duration-500"
              style={{
                width: `${
                  currentStepIndex === -1
                    ? 0
                    : ((currentStepIndex + 1) / steps.length) * 100
                }%`,
              }}
            />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 pt-6 flex-1">
        {/* VIEW 1: PREPARATION SCREEN (Samagri & Naivedyam & Sankalpam Config) */}
        {currentStepIndex === -1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Intro Welcome Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 p-6 md:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Ritual Preparation / தயாரிப்பு
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-amber-100">
                    {pooja.title_en}
                  </h2>
                  <p className="text-stone-300 text-sm md:text-base max-w-2xl leading-relaxed">
                    Welcome to the sacred ritual. Select performer, check Samagri items, configure Sankalpam, and view philosophical meanings.
                  </p>
                </div>

                <button
                  onClick={() => goToStep(0)}
                  className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-bold text-lg shadow-lg shadow-amber-600/30 transition-all hover:scale-105 flex items-center justify-center gap-3 shrink-0"
                >
                  <Flame className="w-6 h-6 fill-stone-950" /> Start Pooja
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* SANKALPAM & PERFORMER GENDER CONFIGURATION CARD */}
            <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-amber-950/20 to-stone-950 border border-amber-500/40 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-200">
                      Sankalpam & Performer Settings (சங்கல்ப அமைப்புகள்)
                    </h3>
                    <p className="text-xs text-stone-400">Configure performer type, date, location, and devotee details</p>
                  </div>
                </div>

                {panchangamData && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Panchangam Loaded
                  </span>
                )}
              </div>

              {/* Performer Gender Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" /> Performed By / வழிபாடு செய்பவர்
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPerformerGender('male')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'male'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    Male (ஆண்)
                  </button>
                  <button
                    onClick={() => setPerformerGender('female')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'female'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    Female (பெண்)
                  </button>
                  <button
                    onClick={() => setPerformerGender('couple')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'couple'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    Couple (தம்பதி)
                  </button>
                </div>
              </div>

              {/* Input Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> Pooja Date / நாள்
                  </label>
                  <input
                    type="date"
                    value={sankalpamDate}
                    onChange={(e) => setSankalpamDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Location Detection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" /> Location / இடம்
                    </label>
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                        </>
                      ) : (
                        '📍 Detect Location'
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter city or coordinates"
                    value={sankalpamData.place}
                    onChange={(e) => setSankalpamData({ ...sankalpamData, place: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                  {locationStatus && <p className="text-xs text-amber-400/80">{locationStatus}</p>}
                </div>

                {/* Devotee Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" /> Devotee Name / பக்தர் பெயர்
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={sankalpamData.devoteeName}
                    onChange={(e) => setSankalpamData({ ...sankalpamData, devoteeName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Gotra */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> Gotra (Gothram) / கோத்ரம்
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyapa / Bharadwaja"
                    value={sankalpamData.gotra}
                    onChange={(e) => setSankalpamData({ ...sankalpamData, gotra: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Samagri Checklist Section */}
            <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                      Pooja Samagri Checklist
                    </h3>
                    <p className="text-xs text-stone-400">
                      Collected {samagriCompletedCount} of {parsedSamagriList.length} items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={checkAllSamagri}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-amber-300 border border-stone-700 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3.5 h-3.5" /> Check All
                  </button>
                  <button
                    onClick={resetSamagri}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-stone-400">
                  <span>Preparation Progress</span>
                  <span>{Math.round((samagriCompletedCount / (parsedSamagriList.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(samagriCompletedCount / (parsedSamagriList.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Samagri Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {parsedSamagriList.map((item) => {
                  const isChecked = !!checkedSamagri[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSamagri(item.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-amber-400">
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5 fill-amber-500 text-stone-950" />
                          ) : (
                            <Circle className="w-5 h-5 text-stone-600" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isChecked ? 'line-through opacity-80' : ''}`}>
                            {instructionLang === 'ta' && item.item_ta ? item.item_ta : item.item_en}
                          </p>
                          {instructionLang === 'en' && item.item_ta && (
                            <p className="text-xs text-amber-400/80 font-medium">{item.item_ta}</p>
                          )}
                        </div>
                      </div>

                      {item.quantity && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-800 text-stone-400 border border-stone-700">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Naivedyam Suggestions Card Section */}
            <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-100">
                    Naivedyam Suggestions (நைவேத்தியம்)
                  </h3>
                  <p className="text-xs text-stone-400">Sacred food offerings recommended for this pooja</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parsedNaivedyamList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-stone-950/70 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <h4 className="font-bold text-amber-200 text-base">
                          {instructionLang === 'ta' && item.name_ta ? item.name_ta : item.name_en}
                        </h4>
                      </div>
                      {item.name_ta && instructionLang === 'en' && (
                        <p className="text-xs text-amber-400/90 font-medium pl-6">{item.name_ta}</p>
                      )}
                    </div>

                    {(item.description_en || item.description_ta) && (
                      <p className="text-xs text-stone-400 leading-relaxed border-t border-stone-800/80 pt-2">
                        {instructionLang === 'ta' && item.description_ta
                          ? item.description_ta
                          : item.description_en}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Start Action */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleNextStep}
                className="w-full max-w-md py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-bold text-lg shadow-xl shadow-amber-600/30 transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                <Flame className="w-6 h-6 fill-stone-950" /> Begin First Step (படி 1)
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: STEP-BY-STEP FLOW */}
        {currentStepIndex >= 0 && currentStep && !isCompleted && (
          <div className="relative min-h-[500px]">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={currentStep.id || currentStepIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Step Header Card */}
                <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-amber-500/30 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Step {currentStepIndex + 1} of {steps.length}
                    </span>

                    {/* Step Jump Select */}
                    <select
                      value={currentStepIndex}
                      onChange={(e) => goToStep(Number(e.target.value))}
                      className="bg-stone-950 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 focus:outline-none"
                    >
                      {steps.map((s, idx) => (
                        <option key={s.id || idx} value={idx} disabled={!isStepAvailableForGender(s)}>
                          Step {idx + 1}: {s.step_title_en} {!isStepAvailableForGender(s) ? '(Skipped)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-amber-100">
                      {currentStep.step_title_en}
                    </h2>
                    {currentStep.step_title_ta && (
                      <p className="text-base text-amber-400 font-semibold mt-1">
                        {currentStep.step_title_ta}
                      </p>
                    )}
                  </div>

                  {/* Instruction */}
                  <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-800 text-stone-200 text-sm md:text-base leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {instructionLang === 'ta' && currentStep.instruction_ta
                          ? currentStep.instruction_ta
                          : currentStep.instruction_en}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PHILOSOPHY & SIGNIFICANCE EXPANDABLE ACCORDION CARD (FOR NOVICES) */}
                {currentStep.philosophy_en && (
                  <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 via-stone-900 to-stone-950 border border-amber-500/30 overflow-hidden shadow-xl">
                    <button
                      onClick={() => setShowPhilosophy(!showPhilosophy)}
                      className="w-full px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-amber-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                          <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200 text-sm md:text-base">
                            Spiritual Significance / Why We Do This (தத்துவ விளக்கம்)
                          </h4>
                          <p className="text-xs text-stone-400">Philosophical roots & symbolic meaning for seekers</p>
                        </div>
                      </div>

                      <div className="text-amber-400">
                        {showPhilosophy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {showPhilosophy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-6 pt-2 border-t border-amber-500/20 text-stone-300 text-xs md:text-sm leading-relaxed italic"
                        >
                          <blockquote className="border-l-2 border-amber-400 pl-4 py-1 text-amber-100/90 font-serif">
                            &quot;{currentStep.philosophy_en}&quot;
                          </blockquote>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Dynamic Sankalpam Helper Card */}
                {currentStep.is_dynamic_sankalpam && panchangamData && (
                  <div className="rounded-2xl bg-amber-950/20 border border-amber-500/40 p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                        <Flame className="w-5 h-5" /> Dynamic Sankalpam (சங்கல்பம்)
                      </div>
                      <span className="text-xs text-amber-300 font-mono">
                        {sankalpamData.devoteeName} ({sankalpamData.gotra})
                      </span>
                    </div>

                    <div className="bg-stone-950 p-4 rounded-xl border border-amber-500/20 text-xs md:text-sm text-amber-200/90 font-serif italic leading-relaxed">
                      &quot;
                      {mantraLang === 'sanskrit' && (
                        <>
                          {panchangamData.samvatsara.sanskrit} {panchangamData.ayana.sanskrit} {panchangamData.ritu.sanskrit} {panchangamData.masa.sanskrit} {panchangamData.paksha.sanskrit} {panchangamData.tithi.sanskrit} {panchangamData.vasara.sanskrit} {panchangamData.nakshatra.sanskrit} नक्षत्र युक्तायाम्,{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.gotra}</span> गोत्रोत्भवस्य{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.devoteeName}</span> नामधेयस्य...
                        </>
                      )}
                      {mantraLang === 'tamil' && (
                        <>
                          {panchangamData.samvatsara.tamil}, {panchangamData.ayana.tamil}, {panchangamData.ritu.tamil}, {panchangamData.masa.tamil}, {panchangamData.paksha.tamil}, {panchangamData.tithi.tamil}, {panchangamData.vasara.tamil}, {panchangamData.nakshatra.tamil},{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.gotra}</span> கோத்ரத்து{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.devoteeName}</span> அவர்களுக்கு...
                        </>
                      )}
                      {mantraLang === 'translit' && (
                        <>
                          {panchangamData.samvatsara.translit}, {panchangamData.ayana.translit}, {panchangamData.ritu.translit}, {panchangamData.masa.translit}, {panchangamData.paksha.translit}, {panchangamData.tithi.translit}, {panchangamData.vasara.translit}, {panchangamData.nakshatra.translit},{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.gotra}</span> Gotra{' '}
                          <span className="text-amber-400 underline font-bold">{sankalpamData.devoteeName}</span>...
                        </>
                      )}
                      &quot;
                    </div>
                  </div>
                )}

                {/* Mantra Presentation Section */}
                {(currentStep.mantra_sanskrit || currentStep.mantra_tamil || currentStep.mantra_translit) && (
                  <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950/30 border border-amber-500/40 p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                          <Languages className="w-5 h-5" />
                        </span>
                        <h3 className="text-lg font-bold text-amber-200 uppercase tracking-wider">
                          Sacred Mantra / வேதம் & ஸ்லோகம்
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {mantraLang === 'sanskrit' ? 'Sanskrit Script' : mantraLang === 'tamil' ? 'Tamil Script' : 'English Transliteration'}
                      </span>
                    </div>

                    {/* Mantra Script Box */}
                    <div className="p-6 md:p-8 rounded-xl bg-stone-950/90 border border-amber-500/30 text-center space-y-4 shadow-inner">
                      <p className="text-xl md:text-2xl lg:text-3xl font-serif leading-relaxed text-amber-300 tracking-wide">
                        {mantraLang === 'sanskrit' &&
                          getDynamicMantra(currentStep.mantra_sanskrit || currentStep.mantra_translit, 'sanskrit')}
                        {mantraLang === 'tamil' &&
                          getDynamicMantra(
                            currentStep.mantra_tamil || currentStep.mantra_sanskrit || currentStep.mantra_translit,
                            'tamil'
                          )}
                        {mantraLang === 'translit' &&
                          getDynamicMantra(currentStep.mantra_translit || currentStep.mantra_sanskrit, 'translit')}
                      </p>

                      {currentStep.meaning_en && (
                        <div className="pt-4 border-t border-stone-800/80">
                          <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest mb-1">
                            Meaning / அர்த்தம்
                          </p>
                          <p className="text-sm md:text-base text-stone-300 italic max-w-2xl mx-auto leading-relaxed">
                            &quot;{currentStep.meaning_en}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Archana List Section (if present) */}
                {currentStep.archana_list && currentStep.archana_list.length > 0 && (
                  <div className="rounded-2xl bg-stone-900 border border-amber-500/30 p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-amber-200">
                          Archana Namavali ({currentStep.archana_list.length} Names)
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-800 text-stone-300">
                        {Object.keys(archanaProgress).length} offered
                      </span>
                    </div>

                    {/* Scrollable list */}
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-2.5 divide-y divide-stone-800/60">
                      {currentStep.archana_list.map((item: ArchanaItem, idx: number) => {
                        const isOffered = !!archanaProgress[`archana-${idx}`];
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setArchanaProgress((prev) => ({
                                ...prev,
                                [`archana-${idx}`]: isOffered ? 0 : 1,
                              }))
                            }
                            className={`pt-2.5 pb-2.5 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isOffered ? 'bg-amber-950/30 border border-amber-500/30' : 'hover:bg-stone-950/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold w-7 text-amber-400/80">
                                #{item.number || idx + 1}
                              </span>
                              <div>
                                <p className="text-sm md:text-base font-bold text-amber-100">
                                  {mantraLang === 'tamil' && item.tamil ? item.tamil : item.sanskrit}
                                </p>
                                {item.translit && (
                                  <p className="text-xs text-stone-400 font-medium">{item.translit}</p>
                                )}
                              </div>
                            </div>

                            <button
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                isOffered
                                  ? 'bg-amber-500 text-stone-950'
                                  : 'bg-stone-800 text-amber-300 hover:bg-amber-900/50'
                              }`}
                            >
                              🌸 {isOffered ? 'Offered' : 'Offer Flower'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* POOJA COMPLETE SUMMARY CARD */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl bg-gradient-to-br from-amber-950 via-stone-900 to-stone-900 border-2 border-amber-500 p-8 md:p-12 text-center space-y-6 shadow-2xl"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl">
              <Award className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-amber-200">
                Pooja Sampoornam! (பூஜை பூர்த்தி)
              </h2>
              <p className="text-stone-300 text-base max-w-xl mx-auto">
                May the divine blessings of {pooja.title_en} fill your life with peace, prosperity, health, and wisdom.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 max-w-md mx-auto text-amber-300 font-serif italic text-sm">
              &quot;Om Shanti Shanti Shantih&quot; • &quot;ஓம் சாந்தி சாந்தி சாந்திஃ&quot;
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => goToStep(-1)}
                className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5 text-amber-400" /> Start Again
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* ANCHORED BOTTOM NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-amber-500/20 py-3 px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex <= -1}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              currentStepIndex <= -1
                ? 'opacity-40 bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-stone-800 hover:bg-amber-950 text-amber-300 border border-amber-500/30'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span>Previous</span>
          </button>

          {/* Center Indicator */}
          <div className="text-xs font-semibold text-amber-400/90 text-center hidden sm:block">
            {currentStepIndex === -1 ? (
              <span>Preparation & Settings</span>
            ) : (
              <span>
                Step {currentStepIndex + 1} of {steps.length} ({availableSteps.length} active)
              </span>
            )}
          </div>

          <button
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-bold text-sm shadow-md shadow-amber-600/30 transition-all flex items-center gap-2"
          >
            <span>
              {currentStepIndex === -1
                ? 'Start Pooja'
                : currentStepIndex === steps.length - 1
                ? 'Complete Pooja'
                : 'Next Step'}
            </span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PoojaViewer;
