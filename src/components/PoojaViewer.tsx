'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Award, BookOpen, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Compass, Flame, Flower2, Globe, Info, Languages, Lightbulb, Loader2, MapPin, Moon, RotateCcw, SearchCheck, Sparkles, Sun, User, Users, Utensils } from 'lucide-react';
import { Pooja, PoojaStep, ArchanaItem } from '@/types/pooja';
import { fetchPanchangamData, PanchangamData } from '@/actions/getSankalpam';
import { usePreferences, resolveScript, SCRIPT_LABEL } from '@/lib/preferences';
import type { PoojaMode } from '@/types/pooja';

interface PoojaViewerProps {
  pooja: Pooja;
  steps: PoojaStep[];
}

// Suggestions start once the query is long enough to be worth a lookup.
const MIN_LOCATION_CHARS = 3;

export const PoojaViewer: React.FC<PoojaViewerProps> = ({ pooja, steps }) => {
  // Navigation & Language States
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = Samagri / Prep
  // Language and theme live in a persisted context, not here. Holding them in
  // component state meant every navigation remounted this component and reset
  // the choice back to English and Sanskrit.
  const {
    instructionLang,
    setInstructionLang,
    mantraScript: mantraLang,
    setMantraScript: setMantraLang,
    theme,
    toggleTheme,
  } = usePreferences();
  const [direction, setDirection] = useState<number>(1);

  // Performer Gender State ('male' | 'female' | 'couple')
  const [performerGender, setPerformerGender] = useState<'male' | 'female' | 'couple'>('male');

  // Multi-day observances. Day one is the full pooja; later days are an
  // abbreviated Punar Pooja because the deity is already installed; the final
  // day adds Udvasanam to release the presence before immersion.
  const [poojaMode, setPoojaMode] = useState<PoojaMode>('main');

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
  });

  // Geolocation & Nominatim Geocoding State
  const [locationQuery, setLocationQuery] = useState<string>('Chennai, TN');
  const [resolvedGeo, setResolvedGeo] = useState<{
    lat: number;
    lon: number;
    displayName: string;
  } | null>({
    lat: 13.0827,
    lon: 80.2707,
    displayName: 'Chennai, Tamil Nadu, India',
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  // Several places share a name, so the user has to choose rather than the app
  // silently taking the first hit.
  const [geoCandidates, setGeoCandidates] = useState<
    { label: string; city: string | null; state: string | null; country: string | null; lat: number; lon: number; osmId: string }[]
  >([]);
  // Typeahead. Suggestions appear as you type rather than after pressing Verify.
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  // Set right after a pick, so committing a place does not immediately re-search
  // the text we just wrote into the input. Starts true because the default
  // location is already resolved and does not need looking up on mount.
  const suppressSearch = useRef(true);
  const searchAbort = useRef<AbortController | null>(null);

  const [panchangamData, setPanchangamData] = useState<PanchangamData | null>(null);

  // Archana Progress State
  const [archanaProgress, setArchanaProgress] = useState<Record<string, number>>({});

  // Pooja Complete Summary State
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch Panchangam Data from Server Action
  const loadPanchangam = useCallback(async () => {
    if (!resolvedGeo) return;
    try {
      // Pass the resolved place and the performer through, so the sentence is
      // complete rather than a skeleton the UI glues together afterwards.
      const data = await fetchPanchangamData(
        sankalpamDate,
        resolvedGeo.lat,
        resolvedGeo.lon,
        {
          place: resolvedGeo.displayName,
          gotra: sankalpamData.gotra,
          name: sankalpamData.devoteeName,
          gender: performerGender === 'female' ? 'female' : 'male',
        }
      );
      setPanchangamData(data);
    } catch (e) {
      console.error('Failed to load Panchangam data:', e);
    }
  }, [sankalpamDate, resolvedGeo, sankalpamData, performerGender]);

  useEffect(() => {
    loadPanchangam();
  }, [loadPanchangam]);

  // Reverse Geocoding (Detect Location Button)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus('Detecting coordinates via GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Through our route, so the OSM usage policy is respected and the
          // result comes back already shaped as city / state / country.
          const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const data = await response.json();
          const place = (data.places ?? [])[0];

          if (place) {
            setLocationQuery(place.label);
            setResolvedGeo({ lat: Number(lat), lon: Number(lon), displayName: place.label });
            setLocationStatus('');
          } else {
            // Coordinates are what the Sankalpam needs, so keep them even when
            // we cannot put a name to the place.
            setLocationQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setResolvedGeo({
              lat: Number(lat),
              lon: Number(lon),
              displayName: `GPS ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            });
            setLocationStatus('Coordinates captured, but the place could not be named.');
          }
        } catch (err) {
          console.warn('Reverse geocoding error:', err);
          setLocationQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          setResolvedGeo({
            lat: Number(lat),
            lon: Number(lon),
            displayName: `GPS ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          });
          setLocationStatus('Coordinates captured; naming the place failed.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsDetectingLocation(false);
        setLocationStatus('Location permission denied. Please enter city & click Verify.');
      },
      { timeout: 10000 }
    );
  };

  // Forward Geocoding (Manual Entry Validation)
  const handleVerifyLocation = async () => {
    if (!locationQuery.trim()) {
      setLocationStatus('Please enter a city or town name.');
      return;
    }

    setIsVerifyingLocation(true);
    setGeoCandidates([]);
    setLocationStatus('Looking up location...');

    try {
      // Server route, not Nominatim directly: it sends an identifying
      // User-Agent, caches, and holds to one request per second.
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(locationQuery.trim())}`
      );
      const data = await response.json();
      const places = data.places ?? [];

      if (places.length === 0) {
        setResolvedGeo(null);
        setLocationStatus('No match. Try adding the state or country, e.g. "Chennai, India".');
      } else if (places.length === 1) {
        applyPlace(places[0]);
      } else {
        setGeoCandidates(places);
        setLocationStatus(`${places.length} places share that name. Pick the right one.`);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      setLocationStatus('Network error while looking up the location.');
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  // Look up as the user types: debounced, so a word typed at speed costs one
  // request rather than one per keystroke, and the previous request is aborted
  // so a slow earlier response cannot overwrite a newer one.
  useEffect(() => {
    if (suppressSearch.current) {
      suppressSearch.current = false;
      return;
    }
    const q = locationQuery.trim();
    if (q.length < MIN_LOCATION_CHARS) {
      setGeoCandidates([]);
      setSuggestOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      searchAbort.current?.abort();
      const ac = new AbortController();
      searchAbort.current = ac;
      setIsVerifyingLocation(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        const places = data.places ?? [];
        setGeoCandidates(places);
        setSuggestOpen(places.length > 0);
        setActiveSuggestion(-1);
        setLocationStatus(
          places.length === 0 ? 'No match. Try adding the state or country.' : ''
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setLocationStatus('Could not reach the location service.');
        }
      } finally {
        setIsVerifyingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Commit a chosen place. The label is what the user sees; lat and lon are what
  // the Sankalpam is actually computed from.
  const applyPlace = (place: {
    label: string; city: string | null; state: string | null; country: string | null;
    lat: number; lon: number; osmId: string;
  }) => {
    suppressSearch.current = true;
    setLocationQuery(place.label);
    setResolvedGeo({ lat: place.lat, lon: place.lon, displayName: place.label });
    setGeoCandidates([]);
    setSuggestOpen(false);
    setActiveSuggestion(-1);
    setLocationStatus('');
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

  // True once migration 0009 has run and the steps carry mode tags. Before
  // that every step looks like day one, so filtering by mode would empty the
  // list for Punar and Udvasanam. Fall back to showing everything instead.
  const modesSeeded = useMemo(
    () => steps.some((s) => Array.isArray(s.modes) && s.modes.length > 1),
    [steps]
  );

  const isStepInMode = useCallback(
    (step: PoojaStep) => {
      if (!modesSeeded) return true;
      return (step.modes ?? ['main']).includes(poojaMode);
    },
    [poojaMode, modesSeeded]
  );

  // Navigation and the step list both need "is this part of today's pooja for
  // this performer", not gender alone.
  const isStepActive = useCallback(
    (step: PoojaStep) => isStepAvailableForGender(step) && isStepInMode(step),
    [isStepAvailableForGender, isStepInMode]
  );

  const availableSteps = useMemo(() => steps.filter(isStepActive), [steps, isStepActive]);

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
    if (newIndex >= 0 && (!panchangamData || !resolvedGeo)) {
      await loadPanchangam();
    }
    setDirection(newIndex > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(newIndex);
    if (isCompleted) setIsCompleted(false);
  };

  const handleNextStep = () => {
    if (!resolvedGeo) return;

    if (currentStepIndex === -1) {
      // Find first valid step
      const firstValidIdx = steps.findIndex(isStepActive);
      goToStep(firstValidIdx >= 0 ? firstValidIdx : 0);
      return;
    }

    // Find next valid step index
    let nextIdx = currentStepIndex + 1;
    while (nextIdx < steps.length && !isStepActive(steps[nextIdx])) {
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
    while (prevIdx >= 0 && !isStepActive(steps[prevIdx])) {
      prevIdx--;
    }

    if (prevIdx >= 0) {
      goToStep(prevIdx);
    } else {
      goToStep(-1);
    }
  };

  const currentStep = steps[currentStepIndex];

  // Where the current step sits among the ones this performer and mode actually
  // do. The raw index counts filtered-out steps, so it is wrong for the counter
  // and the progress bar: a woman doing the Varalakshmi main pooja walks 27 of
  // the 29 rows, not 29, and should not be told otherwise.
  const activePosition = currentStep
    ? availableSteps.findIndex((s) => s === currentStep) + 1
    : 0;

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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-ink-inverse pb-24">
      {/* Top Banner / Sacred Header */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Back to Catalog Link & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-amber-300 transition-colors border border-amber-500/30 text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm"
              title="Return to Pooja Catalog"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>Catalog</span>
            </Link>

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
                    ? 'bg-amber-500 text-ink-inverse shadow-sm'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setInstructionLang('ta')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  instructionLang === 'ta'
                    ? 'bg-amber-500 text-ink-inverse shadow-sm'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex items-center gap-1.5 bg-stone-950 rounded-lg px-2.5 py-1.5 border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors font-semibold"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

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
                    ? 'bg-amber-500 text-ink-inverse shadow-sm'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                संस्कृतम्
              </button>
              <button
                onClick={() => setMantraLang('tamil')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mantraLang === 'tamil'
                    ? 'bg-amber-500 text-ink-inverse shadow-sm'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setMantraLang('translit')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mantraLang === 'translit'
                    ? 'bg-amber-500 text-ink-inverse shadow-sm'
                    : 'text-stone-300 hover:text-stone-100'
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
                    : (activePosition / Math.max(availableSteps.length, 1)) * 100
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
                    Welcome to the sacred ritual. Select performer, check Samagri items, verify location coordinates for Sankalpam, and view philosophical meanings.
                  </p>
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!resolvedGeo}
                  className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 shrink-0 transition-all ${
                    resolvedGeo
                      ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-ink-inverse shadow-amber-600/30 hover:scale-105 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50 border border-stone-700'
                  }`}
                  title={!resolvedGeo ? 'Please detect or verify your location coordinates first' : 'Start Pooja'}
                >
                  <Flame className="w-6 h-6 fill-current" /> Start Pooja
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* SANKALPAM & NOMINATIM GEOLOCATION CONFIGURATION CARD */}
            <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-amber-950/20 to-stone-950 border border-amber-500/40 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-200">
                      Sankalpam & Location Geocoding (சங்கல்ப அமைப்புகள்)
                    </h3>
                    <p className="text-xs text-stone-400">Verified coordinates ensure accurate spacetime ritual alignment</p>
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
                {/* Which day of the observance. Ganesha Chaturthi is kept for
                    one, three, five, seven, nine or eleven days; only the first
                    and last differ from the middle ones. */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                    <Calendar className="w-4 h-4 text-amber-400" /> Which day? / எந்த நாள்?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      {
                        id: 'main' as PoojaMode,
                        en: 'Main Pooja',
                        ta: 'பிரதான பூஜை',
                        hint: 'First day. Full vidhi, the idol is installed.',
                      },
                      {
                        id: 'punar' as PoojaMode,
                        en: 'Punar Pooja',
                        ta: 'புனர் பூஜை',
                        hint: 'A later day. Shorter: the deity is already installed.',
                      },
                      {
                        id: 'udvasana' as PoojaMode,
                        en: 'Udvasanam only',
                        ta: 'உத்வாசனம்',
                        hint: 'Final day. Closing and release, before immersion.',
                      },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setPoojaMode(m.id);
                          setCurrentStepIndex(-1);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-left transition-all border ${
                          poojaMode === m.id
                            ? 'bg-amber-500 text-ink-inverse border-amber-400 shadow-md'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="block text-xs font-bold">{m.en}</span>
                        <span className="block text-[11px] font-tamil opacity-90" lang="ta">
                          {m.ta}
                        </span>
                        <span className="block text-[10px] mt-0.5 opacity-75 leading-snug">
                          {m.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">
                    {modesSeeded
                      ? `${availableSteps.length} of ${steps.length} steps for this selection.`
                      : 'Day selection has no effect yet: run migration 0009 to tag the steps.'}
                  </p>
                </div>

                  <Users className="w-4 h-4 text-amber-400" /> Performed By / வழிபாடு செய்பவர்
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPerformerGender('male')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'male'
                        ? 'bg-amber-500 text-ink-inverse border-amber-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    Male (ஆண்)
                  </button>
                  <button
                    onClick={() => setPerformerGender('female')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'female'
                        ? 'bg-amber-500 text-ink-inverse border-amber-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    Female (பெண்)
                  </button>
                  <button
                    onClick={() => setPerformerGender('couple')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      performerGender === 'couple'
                        ? 'bg-amber-500 text-ink-inverse border-amber-400 shadow-md'
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

                {/* Location Geocoding Input & Detect/Verify Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" /> City / Location / இடம்
                    </label>

                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> Detecting...
                        </>
                      ) : (
                        '📍 Detect GPS Location'
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Start typing a city, e.g. Chennai"
                        value={locationQuery}
                        role="combobox"
                        aria-expanded={suggestOpen}
                        aria-autocomplete="list"
                        aria-controls="location-suggestions"
                        autoComplete="off"
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          setResolvedGeo(null);
                        }}
                        onFocus={() => {
                          if (geoCandidates.length) setSuggestOpen(true);
                        }}
                        onBlur={() => {
                          // Delayed so a click on a suggestion registers first.
                          setTimeout(() => setSuggestOpen(false), 150);
                        }}
                        onKeyDown={(e) => {
                          if (!suggestOpen || geoCandidates.length === 0) {
                            if (e.key === 'Enter') handleVerifyLocation();
                            return;
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveSuggestion((i) => (i + 1) % geoCandidates.length);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveSuggestion((i) =>
                              i <= 0 ? geoCandidates.length - 1 : i - 1
                            );
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            applyPlace(geoCandidates[activeSuggestion >= 0 ? activeSuggestion : 0]);
                          } else if (e.key === 'Escape') {
                            setSuggestOpen(false);
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
                      />

                      {isVerifyingLocation && (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}

                      {suggestOpen && geoCandidates.length > 0 && (
                        <ul
                          id="location-suggestions"
                          role="listbox"
                          className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-amber-500/40 bg-stone-900 shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-stone-800"
                        >
                          {geoCandidates.map((place, i) => (
                            <li key={place.osmId} role="option" aria-selected={i === activeSuggestion}>
                              <button
                                type="button"
                                onMouseEnter={() => setActiveSuggestion(i)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyPlace(place)}
                                className={`w-full text-left px-3 py-2.5 transition-colors ${
                                  i === activeSuggestion ? 'bg-stone-800' : 'hover:bg-stone-800'
                                }`}
                              >
                                <span className="block text-sm font-medium text-stone-100">
                                  {place.city ?? place.label}
                                </span>
                                <span className="block text-[11px] text-stone-400">
                                  {[place.state, place.country].filter(Boolean).join(', ')}
                                  <span className="text-stone-500">
                                    {'  ·  '}
                                    {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyLocation}
                      disabled={isVerifyingLocation}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-inverse font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow"
                    >
                      {isVerifyingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SearchCheck className="w-4 h-4" />
                      )}
                      Verify
                    </button>
                  </div>

                  {/* VERIFIED COORDINATES DISPLAY DIRECTLY BELOW */}
                  {resolvedGeo ? (
                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-stone-100">{resolvedGeo.displayName}</span>
                      <span className="text-stone-400">
                        {'  ·  '}
                        {resolvedGeo.lat.toFixed(4)}, {resolvedGeo.lon.toFixed(4)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-amber-500/90 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Location not verified yet. Please click &quot;Verify&quot; or &quot;Detect GPS Location&quot; to enable Start Pooja.
                    </p>
                  )}

                  {locationStatus && <p className="text-xs text-stone-400 italic pt-0.5">{locationStatus}</p>}
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
                            <CheckCircle2 className="w-5 h-5 fill-amber-500 text-ink-inverse" />
                          ) : (
                            <Circle className="w-5 h-5 text-stone-600" />
                          )}
                        </div>
                        <div>
                          {(() => {
                            const wantsTamil = instructionLang === 'ta' && Boolean(item.item_ta);
                            const primary = wantsTamil ? item.item_ta : item.item_en;
                            const secondary = wantsTamil ? item.item_en : item.item_ta;
                            return (
                              <>
                                <p
                                  className={`text-sm font-semibold ${wantsTamil ? 'font-tamil' : ''} ${
                                    isChecked ? 'line-through opacity-80' : ''
                                  }`}
                                  lang={wantsTamil ? 'ta' : 'en'}
                                >
                                  {primary}
                                </p>
                                {secondary && secondary !== primary && (
                                  <p
                                    className={`text-xs text-amber-400/80 font-medium ${
                                      wantsTamil ? '' : 'font-tamil'
                                    }`}
                                    lang={wantsTamil ? 'en' : 'ta'}
                                  >
                                    {secondary}
                                  </p>
                                )}
                              </>
                            );
                          })()}
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
                        {(() => {
                          const wantsTamil = instructionLang === 'ta' && Boolean(item.name_ta);
                          return (
                            <h4
                              className={`font-bold text-amber-200 text-base ${wantsTamil ? 'font-tamil' : ''}`}
                              lang={wantsTamil ? 'ta' : 'en'}
                            >
                              {wantsTamil ? item.name_ta : item.name_en}
                            </h4>
                          );
                        })()}
                      </div>
                      {(() => {
                        // The other language, whichever way round.
                        const wantsTamil = instructionLang === 'ta' && Boolean(item.name_ta);
                        const secondary = wantsTamil ? item.name_en : item.name_ta;
                        if (!secondary || secondary === (wantsTamil ? item.name_ta : item.name_en))
                          return null;
                        return (
                          <p
                            className={`text-xs text-amber-400/90 font-medium pl-6 ${wantsTamil ? '' : 'font-tamil'}`}
                            lang={wantsTamil ? 'en' : 'ta'}
                          >
                            {secondary}
                          </p>
                        );
                      })()}
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
                disabled={!resolvedGeo}
                className={`w-full max-w-md py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${
                  resolvedGeo
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-ink-inverse shadow-amber-600/30 hover:scale-105 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50 border border-stone-700'
                }`}
              >
                <Flame className="w-6 h-6 fill-current" /> Begin First Step (படி 1)
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
                      <Sparkles className="w-3.5 h-3.5" /> Step {activePosition} of {availableSteps.length}
                    </span>

                    {/* Step Jump Select */}
                    <select
                      value={currentStepIndex}
                      onChange={(e) => goToStep(Number(e.target.value))}
                      className="bg-stone-950 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 focus:outline-none"
                    >
                      {steps.map((s, idx) =>
                        // A step belonging to a different day is not part of
                        // this pooja at all, so it is left out rather than
                        // greyed. Gender exclusions stay visible and marked,
                        // because knowing a step exists and is not yours is
                        // useful; knowing about tomorrow's steps is not.
                        !isStepInMode(s) ? null : (
                          <option
                            key={s.id || idx}
                            value={idx}
                            disabled={!isStepAvailableForGender(s)}
                          >
                            Step {idx + 1}:{' '}
                            {instructionLang === 'ta' && s.step_title_ta
                              ? s.step_title_ta
                              : s.step_title_en}{' '}
                            {!isStepAvailableForGender(s) ? '(Skipped)' : ''}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    {(() => {
                      // Whichever language is selected leads; the other follows
                      // underneath. Picking Tamil and still getting an English
                      // headline is what made the toggle feel inert.
                      const ta = currentStep.step_title_ta;
                      const wantsTamil = instructionLang === 'ta' && Boolean(ta);
                      return (
                        <>
                          <h2
                            className={`text-2xl md:text-3xl font-extrabold text-amber-100 ${
                              wantsTamil ? 'font-tamil' : ''
                            }`}
                            lang={wantsTamil ? 'ta' : 'en'}
                          >
                            {wantsTamil ? ta : currentStep.step_title_en}
                          </h2>
                          {(wantsTamil || ta) && (
                            <p
                              className={`text-base text-amber-400 font-semibold mt-1 ${
                                wantsTamil ? '' : 'font-tamil'
                              }`}
                              lang={wantsTamil ? 'en' : 'ta'}
                            >
                              {wantsTamil ? currentStep.step_title_en : ta}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Instruction with Robust Language Fallback */}
                  <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-800 text-stone-200 text-sm md:text-base leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      {(() => {
                        const wantsTamil = instructionLang === 'ta';
                        const tamil = currentStep.instruction_ta;
                        const usingFallback = wantsTamil && !tamil;
                        return (
                          <>
                            <p
                              className={`font-medium ${wantsTamil && tamil ? 'font-tamil' : ''}`}
                              lang={wantsTamil && tamil ? 'ta' : 'en'}
                            >
                              {wantsTamil && tamil ? tamil : currentStep.instruction_en}
                            </p>
                            {/* Say so rather than quietly showing English under a
                                Tamil setting, which reads as a broken toggle. */}
                            {usingFallback && (
                              <p className="mt-1.5 text-xs text-stone-400 italic">
                                <span lang="ta">
                                  இந்தப் படிக்கு தமிழ் விளக்கம் இன்னும் இல்லை. ஆங்கிலம் காட்டப்படுகிறது.
                                </span>
                                <span className="not-italic"> · </span>
                                No Tamil instruction for this step yet.
                              </p>
                            )}
                          </>
                        );
                      })()}
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
                      {(() => {
                        // The engine now renders the whole sentence, including
                        // the yoga, the karana, and the second tithi when it
                        // turns during the day. Previously this was hand-glued
                        // from a few fields and left all three out.
                        const core =
                          mantraLang === 'tamil'
                            ? panchangamData.core.tamil
                            : mantraLang === 'translit'
                              ? panchangamData.core.translit
                              : panchangamData.core.sanskrit;
                        return (
                          <>
                            <span
                              className={
                                mantraLang === 'tamil'
                                  ? 'font-tamil'
                                  : mantraLang === 'sanskrit'
                                    ? 'font-deva'
                                    : ''
                              }
                              lang={mantraLang === 'tamil' ? 'ta' : mantraLang === 'sanskrit' ? 'sa' : 'en'}
                            >
                              {core}
                            </span>
                            {(sankalpamData.gotra || sankalpamData.devoteeName) && (
                              <>
                                {' '}
                                <span className="text-amber-400 underline font-bold">
                                  {sankalpamData.gotra}
                                </span>{' '}
                                <span className="text-amber-400 underline font-bold">
                                  {sankalpamData.devoteeName}
                                </span>
                              </>
                            )}
                          </>
                        );
                      })()}
                      &quot;
                    </div>
                  </div>
                )}

                {/* Mantra Presentation Section with Robust Language Fallbacks */}
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
                      {(() => {
                        const r = resolveScript(mantraLang, currentStep);
                        // Name the script actually on screen. Saying "Tamil"
                        // over Devanagari is what made the toggle look broken.
                        return (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                              r.isFallback
                                ? 'bg-stone-800 text-stone-300 border-stone-700'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {r.shown ? SCRIPT_LABEL[r.shown] : 'No mantra'}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Mantra Script Box */}
                    <div className="p-6 md:p-8 rounded-xl bg-stone-950/90 border border-amber-500/30 text-center space-y-4 shadow-inner">
                      {(() => {
                        const r = resolveScript(mantraLang, currentStep);
                        const main = getDynamicMantra(r.text, r.shown ?? 'sanskrit');
                        // When the mantra is in Devanagari or Tamil, always carry
                        // the roman transliteration underneath. Most of the
                        // diaspora audience can follow the sounds but not the
                        // script, and having to switch tabs to read along defeats
                        // the point of chanting with the app.
                        const showGloss =
                          r.shown !== 'translit' && Boolean(currentStep.mantra_translit);
                        const gloss = showGloss
                          ? getDynamicMantra(currentStep.mantra_translit, 'translit')
                          : null;
                        return (
                          <>
                            <p
                              className={`text-xl md:text-2xl lg:text-3xl leading-relaxed text-amber-300 tracking-wide ${
                                r.shown === 'tamil'
                                  ? 'font-tamil'
                                  : r.shown === 'sanskrit'
                                    ? 'font-deva'
                                    : 'font-serif'
                              }`}
                              lang={r.shown === 'tamil' ? 'ta' : r.shown === 'sanskrit' ? 'sa' : 'en'}
                            >
                              {main}
                            </p>
                            {gloss && (
                              <p className="text-sm md:text-base text-stone-400 italic leading-relaxed max-w-2xl mx-auto">
                                {gloss}
                              </p>
                            )}
                            {r.isFallback && r.shown && (
                              <p className="text-xs text-stone-500 pt-1">
                                This step has no {SCRIPT_LABEL[mantraLang]} text yet.
                                Showing {SCRIPT_LABEL[r.shown]}.
                              </p>
                            )}
                          </>
                        );
                      })()}

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
                          {currentStep.archana_list.some((i: ArchanaItem) => i.offering_en)
                            ? `Offerings (${currentStep.archana_list.length})`
                            : `Archana Namavali (${currentStep.archana_list.length} Names)`}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-800 text-stone-300">
                        {Object.keys(archanaProgress).length} offered
                      </span>
                    </div>

                    {/* When every line invokes the same name, the rows lead with
                        what is offered, so the mantra is stated once here rather
                        than repeated down the list. */}
                    {currentStep.archana_list.length > 1 &&
                      currentStep.archana_list[0].offering_en &&
                      currentStep.archana_list.every(
                        (o: ArchanaItem) => o.sanskrit === currentStep.archana_list![0].sanskrit,
                      ) && (
                        <div className="rounded-xl bg-stone-950/60 border border-amber-500/20 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-amber-500/70 mb-1">
                            {instructionLang === 'ta'
                              ? 'ஒவ்வொன்றுக்கும் இந்த மந்திரம்'
                              : 'Recite at every offering'}
                          </p>
                          <p className="text-base font-bold text-amber-100">
                            {mantraLang === 'tamil' && currentStep.archana_list[0].tamil
                              ? currentStep.archana_list[0].tamil
                              : currentStep.archana_list[0].sanskrit}
                          </p>
                          {currentStep.archana_list[0].translit && (
                            <p className="text-xs text-stone-400 font-medium">
                              {currentStep.archana_list[0].translit}
                            </p>
                          )}
                        </div>
                      )}

                    {/* Scrollable list */}
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-2.5 divide-y divide-stone-800/60">
                      {currentStep.archana_list.map((item: ArchanaItem, idx: number) => {
                        const isOffered = !!archanaProgress[`archana-${idx}`];
                        // In the Patra Pooja every line invokes the same name,
                        // because the paddhatis disagree on the pairing. Showing
                        // the mantra 21 times buries the leaf, which is the part
                        // that actually changes, so lead with the offering there.
                        const repeatedName =
                          !!item.offering_en &&
                          currentStep.archana_list!.every(
                            (o: ArchanaItem) => o.sanskrit === currentStep.archana_list![0].sanskrit,
                          );
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
                                {repeatedName ? (
                                  <>
                                    <p className="text-sm md:text-base font-bold text-amber-100">
                                      {instructionLang === 'ta' && item.offering_ta
                                        ? item.offering_ta
                                        : item.offering_en}
                                    </p>
                                    {item.botanical && (
                                      <p className="text-xs text-stone-400 font-medium italic">
                                        {item.botanical}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm md:text-base font-bold text-amber-100">
                                      {mantraLang === 'tamil' && item.tamil ? item.tamil : item.sanskrit}
                                    </p>
                                    {item.translit && (
                                      <p className="text-xs text-stone-400 font-medium">{item.translit}</p>
                                    )}
                                    {/* Anga and durva offer a different thing at each
                                        line, so the name alone is not enough. */}
                                    {item.offering_en && (
                                      <p className="text-xs text-amber-300/90 font-semibold mt-1">
                                        {instructionLang === 'ta' && item.offering_ta
                                          ? item.offering_ta
                                          : item.offering_en}
                                        {item.botanical && (
                                          <span className="text-stone-500 font-normal italic">
                                            {' '}
                                            · {item.botanical}
                                          </span>
                                        )}
                                      </p>
                                    )}
                                  </>
                                )}
                                {item.is_substitutable && item.substitute_with && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    {instructionLang === 'ta'
                                      ? `கிடைக்கவில்லையெனில்: ${item.substitute_with}`
                                      : `If unavailable: ${item.substitute_with}`}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                isOffered
                                  ? 'bg-amber-500 text-ink-inverse'
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
                Step {activePosition} of {availableSteps.length}
              </span>
            )}
          </div>

          <button
            onClick={handleNextStep}
            disabled={!resolvedGeo && currentStepIndex === -1}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
              !resolvedGeo && currentStepIndex === -1
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50 border border-stone-700'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-ink-inverse shadow-amber-600/30'
            }`}
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
