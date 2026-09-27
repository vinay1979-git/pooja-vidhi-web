'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Award, BookOpen, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Compass, Flame, Flower2, Globe, Info, Languages, Lightbulb, Loader2, MapPin, Moon, RotateCcw, SearchCheck, SlidersHorizontal, Sparkles, Sun, User, Users, Utensils, X } from 'lucide-react';
import { Pooja, PoojaStep, ArchanaItem } from '@/types/pooja';
import { fetchPanchangamData, PanchangamData } from '@/actions/getSankalpam';
import { usePreferences, resolveScript, SCRIPT_LABEL, type InstructionLang, type MantraScript } from '@/lib/preferences';
import { renderPerson } from '@/lib/sankalpam';
import { uiText, type UiText } from '@/lib/ui-text';
import { LANGUAGES, SCRIPTS, coverageFor } from '@/lib/languages';
import { SettingRow, SettingsPicker, type PickerOption } from '@/components/SettingsPicker';
import { TempleBell } from '@/components/TempleBell';
import { GopuramIcon } from '@/components/GopuramIcon';
import { StepSheet } from '@/components/StepSheet';
import { agoText, clearProgress, loadProgress, saveProgress, type SavedProgress } from '@/lib/progress';
import type { KartaGender, PoojaMode } from '@/types/pooja';

interface PoojaViewerProps {
  pooja: Pooja;
  steps: PoojaStep[];
}

// Suggestions start once the query is long enough to be worth a lookup.
const MIN_LOCATION_CHARS = 3;

/**
 * The three kartas, in the order the buttons show them.
 *
 * `label` is resolved against the current language at render, so this holds the
 * key rather than the word. Declared once because three places need the same
 * list in the same order: the buttons, the Recommended badge, and the sentence
 * under them that names the recommended one.
 */
const KARTA_CHOICES: { id: KartaGender; label: keyof Pick<UiText, 'male' | 'female' | 'couple'> }[] = [
  { id: 'male', label: 'male' },
  { id: 'female', label: 'female' },
  { id: 'couple', label: 'couple' },
];

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

  /**
   * THE LANGUAGE SETTING APPLIES INSIDE THE POOJA AND NOWHERE ELSE.
   *
   * The preparation screen -- the date, the place, the karta, the gotra, the
   * samagri list -- is always English. It is the screen where you set things
   * up, and a mis-tap on the language toggle used to change every word on it at
   * once, including the words you would need to read in order to change it
   * back. A setup screen that can become unreadable by accident is a worse
   * problem than a setup screen in one language.
   *
   * Once the pooja starts, the language is the whole point and the step screen
   * follows it completely.
   *
   * The header and the footer follow the screen they are attached to, so a
   * screen is never half one language and half the other. Only the language
   * toggle itself reads `instructionLang` directly, because it has to show
   * which language is chosen rather than which is currently on screen.
   */
  const uiLang: InstructionLang = currentStepIndex >= 0 ? instructionLang : 'en';

  /** Every label the app writes itself, in the language of the current screen. */
  const t = uiText(uiLang);

  const [settingsOpen, setSettingsOpen] = useState(false);
  /** null = the settings list itself; otherwise the drill-down that is open. */
  const [picker, setPicker] = useState<'language' | 'script' | null>(null);

  const [stepSheetOpen, setStepSheetOpen] = useState(false);

  /**
   * The furthest step reached this sitting, which is what makes a check mark
   * mean something. currentStepIndex alone cannot: jump back to step 3 to
   * re-read it and every step after it would stop looking done, although you
   * did them.
   */
  const [furthestIndex, setFurthestIndex] = useState(-1);

  /**
   * Progress found in storage, offered rather than applied. Read in an effect
   * rather than in useState's initialiser because localStorage does not exist
   * on the server, and seeding state from it would make the first client render
   * disagree with the server's.
   */
  const [resumable, setResumable] = useState<SavedProgress | null>(null);

  /**
   * Hide the header while the reader is scrolling down through a mantra, bring
   * it back the instant they scroll up.
   *
   * The threshold matters more than it looks. Without one, the sub-pixel
   * scrolling a phone produces while a finger rests on the screen flickers the
   * header in and out; 8px is enough to require an intentional drag. The header
   * also always returns near the top of the page, so it can never be stranded
   * off-screen with nothing left to scroll up through.
   */
  const [chromeHidden, setChromeHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 8) return;
      last = y;
      setChromeHidden(y > 120 && delta > 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * Opening the sheet also reveals the header.
   *
   * Done here rather than in an effect on settingsOpen: an effect that calls
   * setState during render is the cascading-render lint this file already has
   * three of, and there is no reason to add a fourth when the only thing that
   * opens the sheet is this function.
   */
  const openSettings = useCallback(() => {
    setChromeHidden(false);
    setPicker(null);
    setSettingsOpen(true);
  }, []);

  /** Closing always returns to the top level, so it never reopens mid-list. */
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setPicker(null);
  }, []);

  /**
   * What the open picker lists.
   *
   * Coverage is worked out from THIS pooja's steps, which are already in hand,
   * so it costs no query -- and it answers the question the reader actually
   * has, which is whether the thing in front of them will be in their language
   * rather than whether the app as a whole is.
   *
   * Scripts carry no coverage. Every one of them is generated from the stored
   * Devanagari, so a script that exists is complete by construction and a
   * badge saying so would be noise on every row.
   */
  const pickerOptions: PickerOption[] = useMemo(() => {
    if (picker === 'script') {
      return SCRIPTS.map((x) => ({ code: x.code, endonym: x.endonym, roman: x.roman }));
    }
    return LANGUAGES.map((l) => ({
      code: l.code,
      endonym: l.endonym,
      roman: l.roman,
      coverage: coverageFor(l.code, steps),
    }));
  }, [picker, steps]);

  /**
   * Who is performing: the karta.
   *
   * Some rites expect a particular karta and the pooja says so in
   * karta_recommended. Varalakshmi recommends a woman. It is a RECOMMENDATION
   * and not a gate: the book frames the vratham as kept by women and tells its
   * whole chapter through them, but it nowhere says a man may not keep it, and
   * an app has no business inventing a prohibition its source declines to make.
   *
   * So the recommendation only picks the opening value. All three buttons stay
   * live, and choosing another one is not an error state.
   */
  const recommendedKarta = pooja.karta_recommended ?? null;
  const [kartaGender, setKartaGender] = useState<KartaGender>(recommendedKarta ?? 'male');

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
  //
  // The box starts filled rather than empty, because the sankalpam names the
  // place and a blank field would block the pooja on a question most readers
  // would answer the same way twice a year. If the browser has already been
  // given location permission, the effect further down replaces this with where
  // they actually are, before they look at it.
  // Spelled exactly as displayName below, not shortened: the typeahead skips a
  // lookup when the box already says what is resolved, and "Pune, Maharashtra"
  // is not that string.
  const [locationQuery, setLocationQuery] = useState<string>('Pune, Maharashtra, India');
  const [resolvedGeo, setResolvedGeo] = useState<{
    lat: number;
    lon: number;
    displayName: string;
  } | null>({
    lat: 18.5204,
    lon: 73.8567,
    displayName: 'Pune, Maharashtra, India',
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

  // Which archana lines have been offered, keyed `${stepId}::${index}`.
  //
  // The key used to be `archana-${index}` alone, with no step in it. Every
  // archana step in the pooja therefore shared one set of keys: offering the
  // first flower in the Patra Pooja lit up the first line of the Pushpa Pooja,
  // the Durva Pooja and the Ashtottaram as well, because all four are line #0.
  // Two steps can share an index; they cannot share an id.
  const [archanaProgress, setArchanaProgress] = useState<Record<string, boolean>>({});

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
          gender: kartaGender === 'female' ? 'female' : 'male',
        }
      );
      setPanchangamData(data);
    } catch (e) {
      console.error('Failed to load Panchangam data:', e);
    }
  }, [sankalpamDate, resolvedGeo, sankalpamData, kartaGender]);

  useEffect(() => {
    loadPanchangam();
  }, [loadPanchangam]);

  /**
   * Take a GPS fix, name it if we can, and put it in the box.
   *
   * `silent` is the difference between the reader pressing the button and the
   * page helping itself on load. A silent run says nothing while it works and
   * says nothing if it fails -- there is a perfectly good default in the box
   * already, and a status line about GPS the reader never asked for is noise on
   * a screen that is meant to be calm.
   */
  const applyGpsFix = useCallback(
    async (lat: number, lon: number, silent: boolean) => {
      // Every path here writes into the location box, and writing into it is
      // what the typeahead watches. Without this the box would immediately
      // search for the place we just resolved and drop a suggestion list over
      // the answer.
      const commit = (query: string, displayName: string) => {
        suppressSearch.current = true;
        setLocationQuery(query);
        setResolvedGeo({ lat: Number(lat), lon: Number(lon), displayName });
        setSuggestOpen(false);
        setGeoCandidates([]);
      };

      try {
        // Through our route, so the OSM usage policy is respected and the
        // result comes back already shaped as city / state / country.
        const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const place = (data.places ?? [])[0];

        if (place) {
          commit(place.label, place.label);
          setLocationStatus('');
        } else {
          // Coordinates are what the Sankalpam needs, so keep them even when
          // we cannot put a name to the place.
          const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          commit(coords, `GPS ${coords}`);
          if (!silent) setLocationStatus('Coordinates captured, but the place could not be named.');
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
        const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        commit(coords, `GPS ${coords}`);
        if (!silent) setLocationStatus('Coordinates captured; naming the place failed.');
      }
    },
    [],
  );

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
        await applyGpsFix(position.coords.latitude, position.coords.longitude, false);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsDetectingLocation(false);
        setLocationStatus('Location permission denied. Please enter city & click Verify.');
      },
      { timeout: 10000 }
    );
  };

  /**
   * If this browser has ALREADY been given location permission, use it on load.
   *
   * Deliberately gated on permissions.query returning 'granted'. Calling
   * getCurrentPosition on 'prompt' would throw a permission dialog at someone
   * who has just opened a page about a pooja and asked for nothing, which is
   * the behaviour every site is disliked for. Somebody who has granted it once
   * has already said yes, and this spares them pressing the button every time.
   *
   * Everything here degrades to the default place: Firefox and Safari have not
   * always implemented permissions.query for geolocation, the promise can
   * reject, and the fix itself can time out. All of that ends with Pune still
   * in the box, which is a working sankalpam rather than an error.
   */
  useEffect(() => {
    let cancelled = false;
    if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions) return;

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return;
            void applyGpsFix(position.coords.latitude, position.coords.longitude, true);
          },
          () => {
            /* Already granted and still failed. Keep the default and say nothing. */
          },
          { timeout: 10000 },
        );
      })
      .catch(() => {
        /* No permissions API for geolocation here. Keep the default. */
      });

    return () => {
      cancelled = true;
    };
  }, [applyGpsFix]);

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
    // Nothing to look up when the box already says exactly what is resolved.
    //
    // suppressSearch alone was not enough. It is a one-shot ref, so it holds
    // only if this effect runs exactly once before the reader types -- and in
    // development React invokes effects twice on mount, so the second run
    // searched for the default place and dropped a suggestion list on top of
    // the answer the page had just given. Two Punes, one of them in Kolhapur.
    //
    // Asking whether the text matches the resolved place is a fact about the
    // state rather than a count of renders, so it does not care how many times
    // this runs. It covers picking a suggestion and a GPS fix as well, both of
    // which write the resolved name straight into the box.
    if (resolvedGeo && q === resolvedGeo.displayName.trim()) {
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
  }, [locationQuery, resolvedGeo]);

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

  // Helper to check if step is allowed for current kartaGender
  // `who` defaults to the karta currently selected. It is a parameter because
  // the resume card has to ask this question about the karta that was SAVED,
  // before restoring it -- and duplicating the rule there is how the two copies
  // drift apart.
  const isStepAvailableForGender = useCallback(
    (step: PoojaStep, who: KartaGender = kartaGender) => {
      if (!step.gender_target || step.gender_target === 'all' || who === 'couple') {
        return true;
      }
      return step.gender_target === who;
    },
    [kartaGender]
  );

  // Which days this pooja is actually kept over, taken from its own steps.
  //
  // This used to be one flag, `modesSeeded`, set when SOME step carried more
  // than one mode. That conflated two situations that need opposite handling:
  //
  //   - the steps carry no mode tags at all, because a migration has not run.
  //     Filtering would empty the list, so show everything.
  //   - the pooja genuinely has ONE mode. The Nitya Panchayatana rite is kept
  //     every morning: there is no later day to return for and no image to
  //     release. It was being offered a Punar and an Udvasanam button that did
  //     nothing, under a developer's note telling the user to run a migration.
  //
  // So: tagged at all, and how many distinct modes are on offer.
  const modesTagged = useMemo(
    () => steps.some((s) => Array.isArray(s.modes) && s.modes.length > 0),
    [steps]
  );
  const offeredModes = useMemo(() => {
    const found = new Set<PoojaMode>();
    for (const s of steps) for (const m of s.modes ?? []) found.add(m as PoojaMode);
    return found;
  }, [steps]);
  // Only worth asking the question when there is more than one answer.
  const showModePicker = modesTagged && offeredModes.size > 1;

  // A single-mode pooja is always in that mode, whatever the state says. Derived
  // rather than pushed through setState in an effect, which this file already
  // has too much of.
  const effectiveMode: PoojaMode = showModePicker
    ? poojaMode
    : ((offeredModes.values().next().value as PoojaMode) ?? 'main');

  /** Same reason as above for the parameter. */
  const isStepInMode = useCallback(
    (step: PoojaStep, mode: PoojaMode = effectiveMode) => {
      if (!modesTagged) return true;
      return (step.modes ?? ['main']).includes(mode);
    },
    [effectiveMode, modesTagged]
  );

  // Navigation and the step list both need "is this part of today's pooja for
  // this performer", not gender alone.
  const isStepActive = useCallback(
    (step: PoojaStep) => isStepAvailableForGender(step) && isStepInMode(step),
    [isStepAvailableForGender, isStepInMode]
  );

  const availableSteps = useMemo(() => steps.filter(isStepActive), [steps, isStepActive]);

  // Every step is a new screen, so start it at the top. Without this the new
  // step inherits the scroll position of the one before it, and on a phone --
  // where a step with an archana list runs well past the viewport -- Next Step
  // drops you into the middle of the next instruction, its heading already
  // scrolled past.
  //
  // This has to be an effect, not a line in goToStep. Scrolling synchronously
  // inside the click handler interrupts the exit animation that AnimatePresence
  // mode="wait" is waiting on, so the next step never mounts and the screen
  // goes blank while the footer counter keeps advancing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentStepIndex]);

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

  /**
   * Look for somewhere to pick up, once, on mount.
   *
   * Nothing is applied here. The reader lands on the preparation screen as
   * always and is offered the choice, because opening the app and being moved
   * somewhere you did not ask to go is worse than one extra tap -- and the
   * preparation screen is where you would check your samagri before resuming
   * anyway.
   */
  useEffect(() => {
    // setState in an effect, deliberately, and the one render it costs is the
    // price of not lying to the server.
    //
    // localStorage does not exist during SSR. Seeding this with a lazy useState
    // initialiser would make the server render no banner and the client render
    // one, which is a hydration mismatch. useSyncExternalStore is the usual
    // answer for reading an external store, and does not fit either: its
    // getSnapshot must return a referentially stable value or React loops, and
    // this state also has to be dismissable locally -- Continue hides the
    // banner without clearing the saved progress, which a store read cannot
    // express. preferences.tsx reads its own storage the same way for the same
    // reason.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable(loadProgress(pooja.id));
  }, [pooja.id]);

  /**
   * Write it back whenever anything worth keeping moves.
   *
   * Skipped while still on the preparation screen: -1 is not progress, and
   * saving it would overwrite a real position from earlier in the day with
   * nothing the moment the page loaded.
   */
  useEffect(() => {
    if (currentStepIndex < 0) return;
    saveProgress(pooja.id, {
      stepIndex: currentStepIndex,
      mode: poojaMode,
      karta: kartaGender,
      samagri: checkedSamagri,
      archana: archanaProgress,
    });
  }, [pooja.id, currentStepIndex, poojaMode, kartaGender, checkedSamagri, archanaProgress]);

  /** A finished pooja is not a half-finished one. Nothing left to resume. */
  useEffect(() => {
    if (isCompleted) clearProgress(pooja.id);
  }, [isCompleted, pooja.id]);

  // Handle Step Navigation with Gender-aware skipping
  const goToStep = async (newIndex: number) => {
    if (newIndex >= 0 && (!panchangamData || !resolvedGeo)) {
      await loadPanchangam();
    }
    setDirection(newIndex > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(newIndex);
    // Only ever grows. Going back to re-read a step must not un-do the ones
    // after it.
    setFurthestIndex((f) => Math.max(f, newIndex));
    if (isCompleted) setIsCompleted(false);
  };

  /** Put back everything that was saved, then go there. */
  const resumeHere = useCallback(async () => {
    if (!resumable) return;
    setPoojaMode(resumable.mode);
    setKartaGender(resumable.karta);
    setCheckedSamagri(resumable.samagri ?? {});
    setArchanaProgress(resumable.archana ?? {});
    setFurthestIndex(resumable.stepIndex);
    setResumable(null);
    await goToStep(resumable.stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumable]);

  /**
   * Where the saved step sits in the list the reader will actually see.
   *
   * Counted with the SAVED mode and karta rather than the current ones, because
   * the card is shown before either has been restored. Using steps.length
   * instead would have printed "step 10 of 37" over a header that then said
   * "Step 10 of 36" -- the raw count includes the steps this karta does not
   * perform, and the header does not.
   */
  const resumeAt = useMemo(() => {
    if (!resumable) return null;
    const target = steps[resumable.stepIndex];
    if (!target) return null;
    const shown = steps.filter(
      (st) => isStepInMode(st, resumable.mode) && isStepAvailableForGender(st, resumable.karta),
    );
    const at = shown.indexOf(target);
    return {
      at: at >= 0 ? at + 1 : resumable.stepIndex + 1,
      total: shown.length,
      title: (uiLang === 'ta' && target.step_title_ta) || target.step_title_en || '',
    };
  }, [resumable, steps, isStepInMode, isStepAvailableForGender, uiLang]);

  const startOver = useCallback(() => {
    clearProgress(pooja.id);
    setResumable(null);
  }, [pooja.id]);

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

      // Use the engine's `core`, do not rebuild it.
      //
      // This function used to assemble the panchangam itself, field by field,
      // and it assembled a SHORTER sentence than src/lib/sankalpam.ts renders
      // three lines further up the same screen: it left out the yoga, the
      // karana and the second tithi when the tithi turns during the day. Those
      // three are exactly what the engine was written to add. So the Sankalpam
      // step showed the sentence twice, once complete in its own card and once
      // degraded inside the mantra, and the degraded one is the one a person
      // reciting from the mantra box would have said.
      const key = script === 'sanskrit' ? 'sanskrit' : script === 'tamil' ? 'tamil' : 'translit';
      const person = renderPerson(
        script === 'sanskrit' ? 'deva' : script === 'tamil' ? 'tamil' : 'iast',
        {
          gotra: sankalpamData.gotra || undefined,
          name: sankalpamData.devoteeName || undefined,
          gender: kartaGender,
        },
      );
      const dynamicText = [p.core[key], person].filter(Boolean).join(' ');

      if (originalText.includes('[DYNAMIC_PANCHANGAM_DATA]')) {
        return originalText.replace('[DYNAMIC_PANCHANGAM_DATA]', dynamicText);
      }
      if (originalText.includes('[DYNAMIC_SANKALPAM]')) {
        return originalText.replace('[DYNAMIC_SANKALPAM]', dynamicText);
      }

      return originalText;
    },
    [panchangamData, sankalpamData, kartaGender]
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
      {/* Slides out of the way when the reader scrolls down and comes back the
          moment they scroll up. Measured at 375x812: the header was 159px and
          the footer 69px, so 28% of a phone screen was chrome before any
          liturgy. The controls that made it three rows tall now live in a
          sheet, and this hides what is left while reading. */}
      <header
        className={`sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl
          transition-transform duration-300 motion-reduce:transition-none
          ${chromeHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          {/* Back to Catalog Link & Title */}
          {/* min-w-0 lets the title truncate instead of wrapping to two lines,
              which on a phone pushed the language toggles down and cost about
              a fifth of the screen before any content. */}
          {/* min-w-0 allows the ellipsis; the basis floor stops the title
              surrendering all its width to the toggles, which at tablet size
              cut it to "Standard Ganes...". Below that floor the header's
              flex-wrap drops the toggles to their own line instead. */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:min-w-[22rem]">
            {/* A gopuram rather than a back-chevron. The chevron said "go up
                one", which is true but uninformative; this says where. */}
            <Link
              href="/"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-amber-300 transition-colors border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
              title={t.catalog}
              aria-label={t.catalog}
            >
              <GopuramIcon className="w-4 h-4" />
              <span>{t.catalog}</span>
            </Link>

            {/* One title, in the reader's language. Printing both stacked cost a
                line of header on every screen to say the same thing twice. */}
            <div className="min-w-0">
              <h1
                className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-wide truncate"
                lang={uiLang === 'ta' && pooja.title_ta ? 'ta' : 'en'}
              >
                {uiLang === 'ta' && pooja.title_ta ? pooja.title_ta : pooja.title_en}
              </h1>
            </div>
          </div>

          {/* One button instead of three control groups.
              The toggles were an Instruction pair, a theme button and a Mantra
              pair, laid out with flex-wrap. On a phone they wrapped to two rows
              and made the header 159px tall. They also do not scale: a third
              instruction language adds a third chip to a row that already
              wraps. Behind a sheet, adding a language costs nothing on screen. */}
          <div className="shrink-0 flex items-center gap-1.5">
            {/* Theme is its own button rather than a row in the sheet.
                It is binary and it always will be, so it is the one setting
                that never needs a list -- and putting it behind two taps to sit
                beside two settings that DO need lists was making the simplest
                control the slowest one. */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="flex items-center bg-stone-950 rounded-lg px-2 py-1.5 border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={openSettings}
              aria-label={t.settings}
              title={t.settings}
              className="flex items-center gap-1.5 bg-stone-950 rounded-lg px-2.5 py-1.5 border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors text-xs font-semibold"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>
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

      {/* Settings sheet.
          Everything that used to sit permanently in the header. A sheet rather
          than a dropdown because the next thing to land here is a third and
          fourth instruction language, and a list grows downward for free where
          a row of chips has to wrap. */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={t.settings}
        >
          <button
            className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"
            onClick={() => closeSettings()}
            aria-label={t.close}
            tabIndex={-1}
          />
          <div className="relative w-full sm:max-w-sm bg-stone-900 border-t sm:border border-amber-500/25 sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            {picker ? (
              <SettingsPicker
                title={picker === 'language' ? t.instructionLanguage : t.mantraScript}
                closeLabel={t.close}
                current={picker === 'language' ? instructionLang : mantraLang}
                options={pickerOptions}
                onPick={(code) => {
                  if (picker === 'language') setInstructionLang(code as InstructionLang);
                  else setMantraLang(code as MantraScript);
                  setPicker(null);
                }}
                onBack={() => setPicker(null)}
                onClose={closeSettings}
              />
            ) : (
              <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                {t.settings}
              </h2>
              <button
                onClick={closeSettings}
                aria-label={t.close}
                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TWO ROWS, NOT THREE GRIDS.
                Each was a two-column grid of chips, which is fine at two
                options and is the whole problem at fourteen: instructions
                becomes seven rows, mantra script another seven, and the sheet
                turns into a scroll with no way to search it.

                A row that shows the current value and opens a list costs the
                same height whether there are two languages or twenty, and it
                is the pattern every phone settings screen already uses.

                The theme is not here at all any more -- it has its own button
                in the header. It is binary forever, so making it cost two taps
                through a sheet was always wrong. */}
            <div className="space-y-2">
              <SettingRow
                icon={<Globe className="w-4 h-4 text-amber-400" />}
                label={t.instructionLanguage}
                value={LANGUAGES.find((l) => l.code === instructionLang)?.endonym ?? instructionLang}
                onClick={() => setPicker('language')}
              />
              <SettingRow
                icon={<Languages className="w-4 h-4 text-amber-400" />}
                label={t.mantraScript}
                value={SCRIPTS.find((x) => x.code === mantraLang)?.endonym ?? mantraLang}
                onClick={() => setPicker('script')}
              />
            </div>

            {/* Deliberately NOT linked. Wanting the steps in Tamil and the
                mantra in Devanagari is the normal case here, not an edge one,
                so picking a language never moves the script under you. */}
              </>
            )}
          </div>
        </div>
      )}

      {/* The step sheet. Same surface as the settings sheet -- bottom sheet on a
          phone, centred dialog from sm -- because it is the same gesture, and
          learning one place where lists open is better than learning two. */}
      {stepSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={t.stepsTitle}
        >
          <button
            className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"
            onClick={() => setStepSheetOpen(false)}
            aria-label={t.close}
            tabIndex={-1}
          />
          <div className="relative w-full sm:max-w-md bg-stone-900 border-t sm:border border-amber-500/25 sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            <StepSheet
              title={t.stepsTitle}
              closeLabel={t.close}
              steps={steps}
              currentIndex={currentStepIndex}
              furthestIndex={furthestIndex}
              isInMode={isStepInMode}
              isForKarta={isStepAvailableForGender}
              titleOf={(st) =>
                (uiLang === 'ta' && st.step_title_ta) || st.step_title_en
              }
              phaseLabel={(ph) =>
                ph === 'purvangam'
                  ? t.phasePurvangam
                  : ph === 'uttara'
                    ? t.phaseUttara
                    : t.phasePradhana
              }
              skippedLabel={t.skipped}
              onPick={(i) => {
                setStepSheetOpen(false);
                goToStep(i);
              }}
              onClose={() => setStepSheetOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {/* Clips the step slide transition, which translates content 100px
          sideways on the way in and out; without it a phone can be dragged
          horizontally mid-transition.

          CLIP, not hidden. Setting overflow-x to hidden makes the other axis
          compute to auto, which turned main into a second scroll container
          nested inside the window's and left the page with two things that
          could scroll. overflow-x: clip does the clipping without creating a
          scroll container at all. It also stays off the root, because an
          overflow container above the sticky header would stop it sticking. */}
      <main className="max-w-4xl w-full mx-auto px-4 pt-6 flex-1 overflow-x-clip">
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
              {/* No Start button here. It used to sit at the top of this card,
                  which on a phone put it above every preparation section: you
                  could tap it and be in the pooja without a location, without
                  the samagri checked, and without having seen the naivedyam.
                  Starting belongs at the END of preparation, which is where the
                  two buttons now are. */}
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> {t.ritualPreparation}
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold text-amber-100"
                  lang={uiLang === 'ta' && pooja.title_ta ? 'ta' : 'en'}
                >
                  {uiLang === 'ta' && pooja.title_ta ? pooja.title_ta : pooja.title_en}
                </h2>
                <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                  {t.prepLede}
                </p>
                <ol className="grid gap-2 sm:grid-cols-3 pt-1">
                  {[
                    ['1', t.prepWho],
                    ['2', t.prepWhere],
                    ['3', t.prepWhat],
                  ].map(([n, label]) => (
                    <li key={n} className="flex items-start gap-2.5 text-sm text-stone-300">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center">
                        {n}
                      </span>
                      <span className="leading-snug">{label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Why this rite is kept at all.

                Above the resume card and the sankalpam settings on purpose: it
                is the only thing on this screen that is not a control, and
                someone meeting the rite for the first time should read it
                before being asked for their gotra.

                English falls back silently when there is no Tamil. The step
                instruction announces its fallback because a missing
                translation there is a gap you can measure against the English
                beside it; here there is nothing to compare, so a notice would
                be noise. */}
            {pooja.why_en && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-950/25 via-stone-900 to-stone-950 border border-amber-500/25 p-4 sm:p-6 shadow-lg space-y-2.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> {t.whyWeDoIt}
                </h3>
                <p
                  className={`text-sm text-stone-300 leading-relaxed ${
                    uiLang === 'ta' && pooja.why_ta ? 'font-tamil' : ''
                  }`}
                  lang={uiLang === 'ta' && pooja.why_ta ? 'ta' : 'en'}
                >
                  {(uiLang === 'ta' && pooja.why_ta) || pooja.why_en}
                </p>
              </div>
            )}

            {/* Somewhere to pick up, and a way to look at the whole rite.

                The resume card appears only when there is a saved position
                from today -- progress lapses at midnight, because a rite
                belongs to its sitting and being offered last Tuesday's
                half-finished vratham is not helpful.

                "See all the steps" is here whether or not there is progress: it
                doubles as a table of contents, which is worth having before you
                begin and not only once you are lost in the middle. */}
            {(resumable || steps.length > 0) && (
              <div className="rounded-2xl bg-stone-900/70 border border-amber-500/25 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center gap-3">
                {resumable ? (
                  <>
                    <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-100">
                        {resumeAt &&
                          t.resumeHeading(resumeAt.at, resumeAt.total, resumeAt.title)}
                      </p>
                      <p className="text-xs text-stone-400">{agoText(resumable.at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={resumeHere}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-ink-inverse text-xs font-bold border border-amber-400 shadow-md hover:bg-amber-400 transition-colors"
                      >
                        {t.resumeContinue}
                      </button>
                      <button
                        onClick={startOver}
                        className="px-4 py-2 rounded-xl bg-stone-950 text-stone-300 text-xs font-bold border border-stone-800 hover:border-amber-500/40 transition-colors"
                      >
                        {t.resumeStartOver}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="flex-1 text-sm text-stone-300">
                      {availableSteps.length} steps
                    </p>
                    <button
                      onClick={() => setStepSheetOpen(true)}
                      className="shrink-0 px-4 py-2 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold border border-amber-500/30 hover:border-amber-500/60 transition-colors"
                    >
                      {t.browseSteps}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* SANKALPAM & NOMINATIM GEOLOCATION CONFIGURATION CARD */}
            <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-amber-950/20 to-stone-950 border border-amber-500/40 p-4 sm:p-6 shadow-xl space-y-6">
              <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-200">
                      {t.sankalpamSettings}
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

              {/* Which day of the observance. Ganesha Chaturthi is kept for
                  one, three, five, seven, nine or eleven days; only the first
                  and last differ from the middle ones.

                  This block used to sit INSIDE the karta label below, between
                  its opening tag and its icon, so the whole day picker
                  inherited `flex items-center` from a label meant to hold two
                  words -- and the Users icon and the word Karta were pushed out
                  to the right of the three day buttons and vertically centred
                  against them. */}
              <div className={showModePicker ? '' : 'hidden'}>
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                    <Calendar className="w-4 h-4 text-amber-400" /> {t.whichDay}
                  </label>
                  {/* One language, not two. These buttons printed the English
                      name and the Tamil name stacked, on a screen that is now
                      English throughout -- so every one of them said the same
                      thing twice and neither line was the reader's choice. */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      {
                        id: 'main' as PoojaMode,
                        en: 'Main Pooja',
                        hint: 'First day. Full vidhi, the idol is installed.',
                      },
                      {
                        id: 'punar' as PoojaMode,
                        en: 'Punar Pooja',
                        hint: 'A later day. Shorter: the deity is already installed.',
                      },
                      {
                        id: 'udvasana' as PoojaMode,
                        en: 'Udvasanam only',
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
                        <span className="block text-[10px] mt-0.5 opacity-75 leading-snug">
                          {m.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">
                    {modesTagged
                      ? `${availableSteps.length} of ${steps.length} steps for this selection.`
                      : 'Day selection has no effect yet: run migration 0009 to tag the steps.'}
                  </p>
              </div>

              {/* Who is performing the rite. The word is karta, and the app says
                  karta rather than "performed by": it is the ordinary term for
                  the one performing, and every practitioner who would open this
                  app already knows it.

                  The HEADING inflects with the selection -- Karta, Kartri,
                  Dampati -- because karta is the masculine form and this is the
                  one place in the app that knows who is sitting there. The step
                  prose keeps the bare role noun, because those sentences are
                  about whoever is performing and not about a particular karta.
                  See KARTA_TERM_EN in lib/ui-text.ts for the forms.

                  A pooja may RECOMMEND a karta. Varalakshmi does -- the book's
                  chapter is told entirely through women and glosses the goddess's
                  own disguise as "Suvasini (married woman)". It is a
                  recommendation and not a rule, because the book nowhere writes
                  that a man may not keep the vratham, so the recommended button
                  is pre-selected and the other two stay live. */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" /> {t.kartaHeading(kartaGender)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {KARTA_CHOICES.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => setKartaGender(k.id)}
                      className={`relative py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                        kartaGender === k.id
                          ? 'bg-amber-500 text-ink-inverse border-amber-400 shadow-md'
                          : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                      }`}
                    >
                      {t[k.label]}
                      {recommendedKarta === k.id && (
                        <span
                          className={`block text-[10px] font-normal leading-tight mt-0.5 ${
                            kartaGender === k.id ? 'opacity-80' : 'text-amber-400/80'
                          }`}
                        >
                          {t.recommended}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {recommendedKarta && (
                  <p className="text-[11px] text-stone-400 leading-snug">
                    {t.kartaRecommendation(
                      t[KARTA_CHOICES.find((k) => k.id === recommendedKarta)!.label],
                      t.kartaTerm(recommendedKarta),
                    )}
                  </p>
                )}
              </div>

              {/* Input Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" /> {t.poojaDate}
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
                      <MapPin className="w-4 h-4 text-amber-400" /> {t.cityLocation}
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
                        `📍 ${t.detectLocation}`
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
                    <User className="w-4 h-4 text-amber-400" /> {t.devoteeName}
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
                    <Flame className="w-4 h-4 text-amber-400" /> {t.gotra}
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
                        // Same reason as the archana rows: amber-950 and stone-950
                        // are both near-white in the light theme, so collected and
                        // not-collected became the same colour and only the tick
                        // distinguished them. amber-500 is saffron in both themes.
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300 hover:border-stone-600'
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
                        {/* One name, not both. This row used to print the
                            item in the reader's language and then again in the
                            other one underneath, which made a twenty-one line
                            shopping list forty-two lines long to say nothing
                            new. */}
                        <div>
                          {(() => {
                            const wantsTamil = uiLang === 'ta' && Boolean(item.item_ta);
                            return (
                              <p
                                className={`text-sm font-semibold ${wantsTamil ? 'font-tamil' : ''} ${
                                  isChecked ? 'line-through opacity-80' : ''
                                }`}
                                lang={wantsTamil ? 'ta' : 'en'}
                              >
                                {wantsTamil ? item.item_ta : item.item_en}
                              </p>
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
                    {t.naivedyamSuggestions}
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
                          const wantsTamil = uiLang === 'ta' && Boolean(item.name_ta);
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
                    </div>

                    {(item.description_en || item.description_ta) && (
                      <p className="text-xs text-stone-400 leading-relaxed border-t border-stone-800/80 pt-2">
                        {uiLang === 'ta' && item.description_ta
                          ? item.description_ta
                          : item.description_en}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* No Start button here either. The footer already carries one and
                it is on screen the whole way down this page, so a second at the
                end of the content was the same action twice. The footer is the
                one that stays, because it is where Next Step and Previous live
                for the rest of the pooja. */}
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
                  {/* One tap to the whole rite, from the badge that already
                      says where you are.

                      This was a native <select> of thirty-nine options. It
                      worked and nobody found it: it looks like a form field
                      rather than navigation, it exists only once you are
                      already inside a step, and it says nothing about what you
                      have done. The badge is the obvious thing to press and it
                      was inert. */}
                  <button
                    onClick={() => setStepSheetOpen(true)}
                    aria-haspopup="dialog"
                    className="self-start px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5 hover:border-amber-500/60 hover:text-amber-300 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.stepOf(activePosition, availableSteps.length)}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    {(() => {
                      // ONE title, in the chosen language. This used to print the
                      // other one underneath as a gloss, which is defensible on
                      // its own -- people know these steps by their English
                      // names -- but it is the same two-languages-at-once the
                      // rest of this screen was asked to stop doing, and it
                      // costs a line of the fold on a phone. The English name is
                      // still one tap away in the step-jump list.
                      const ta = currentStep.step_title_ta;
                      const wantsTamil = uiLang === 'ta' && Boolean(ta);
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
                        </>
                      );
                    })()}
                  </div>

                  {/* Instruction with Robust Language Fallback */}
                  <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-800 text-stone-200 text-sm md:text-base leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      {(() => {
                        const wantsTamil = uiLang === 'ta';
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
                              <p className="mt-1.5 text-xs text-stone-400 italic" lang="ta">
                                {t.noTranslationYet}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* PHILOSOPHY & SIGNIFICANCE EXPANDABLE ACCORDION CARD (FOR NOVICES)

                    ENGLISH ONLY, ON PURPOSE. philosophy_ta exists as a column
                    and is null on all 107 steps, and that is the decision rather
                    than a backlog item: this prose is the long discursive
                    "why are we doing this", written for someone meeting the rite
                    rather than reciting it, and it stays in one language.

                    So this reads philosophy_en unconditionally and does NOT
                    print the "not translated yet" notice the instruction field
                    uses -- that notice means "this is missing", and this is not
                    missing. The heading above it still follows the reader's
                    language, because the heading is a label and the app writes
                    its own labels in both. */}
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
                            {t.spiritualSignificance}
                          </h4>
                          <p className="text-xs text-stone-400">{t.spiritualSignificanceSub}</p>
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
                  <div className="rounded-2xl bg-amber-950/20 border border-amber-500/40 p-4 sm:p-6 shadow-xl space-y-4">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                        <Flame className="w-5 h-5" /> {t.dynamicSankalpam}
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
                            : panchangamData.core.sanskrit;
                        return (
                          <>
                            <span
                              className={mantraLang === 'tamil' ? 'font-tamil' : 'font-deva'}
                              lang={mantraLang === 'tamil' ? 'ta' : 'sa'}
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

                    {/* The roman sankalpam used to be reachable only by picking
                        the "Eng" mantra script, which no longer exists. Carry it
                        underneath instead, exactly as the mantra card does, so
                        a reader of neither script can still say the sentence. */}
                    {panchangamData.core.translit && (
                      <p className="px-4 text-xs md:text-sm text-stone-400 italic leading-relaxed">
                        {panchangamData.core.translit}
                      </p>
                    )}
                  </div>
                )}

                {/* Mantra Presentation Section with Robust Language Fallbacks */}
                {(currentStep.mantra_sanskrit || currentStep.mantra_tamil || currentStep.mantra_translit) && (
                  <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-amber-950/30 border border-amber-500/40 p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/20 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                          <Languages className="w-5 h-5" />
                        </span>
                        <h3 className="text-lg font-bold text-amber-200 uppercase tracking-wider">
                          {t.sacredMantra}
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
                            {/* whitespace-pre-line: several mantras are stored
                                with a line break at each pada, the way the
                                published pages set them. Those breaks were
                                being collapsed, so a four-line shloka arrived
                                as one unbroken sentence. */}
                            <p
                              className={`text-xl md:text-2xl lg:text-3xl leading-relaxed text-amber-300 tracking-wide whitespace-pre-line ${
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
                              <p className="text-sm md:text-base text-stone-400 italic leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
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

                    </div>
                  </div>
                )}

                {/* Meaning sits OUTSIDE the mantra card. It used to be inside,
                    so the steps whose content is a namavali or an archana list
                    -- which carry no step mantra -- could never show one. */}
                {currentStep.meaning_en && (
                  <div className="rounded-2xl bg-stone-900 border border-amber-500/25 p-6 shadow-xl">
                    <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest mb-2">
                      {t.meaning}
                    </p>
                    <p className="text-sm md:text-base text-stone-300 italic leading-relaxed">
                      &quot;{currentStep.meaning_en}&quot;
                    </p>
                  </div>
                )}

                {/* Archana List Section (if present) */}
                {currentStep.archana_list && currentStep.archana_list.length > 0 && (
                  <div className="rounded-2xl bg-stone-900 border border-amber-500/30 p-6 shadow-2xl space-y-4">
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-amber-200">
                          {currentStep.archana_list.some((i: ArchanaItem) => i.offering_en)
                            ? `${t.offerings} (${currentStep.archana_list.length})`
                            : `Archana Namavali (${currentStep.archana_list.length} Names)`}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-800 text-stone-300">
                        {/* Count this step's offered lines, not the size of the
                            map. Object.keys counted every line ever touched in
                            the whole pooja, and un-offering a line left its key
                            behind with a falsy value, so the tally only ever
                            went up and could exceed the number of lines shown. */}
                        {t.offeredCount(
                          currentStep.archana_list.filter(
                            (_: ArchanaItem, i: number) =>
                              archanaProgress[`${currentStep.id}::${i}`],
                          ).length,
                          currentStep.archana_list.length,
                        )}
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
                            {uiLang === 'ta'
                              ? t.sameMantraEach
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
                        const key = `${currentStep.id}::${idx}`;
                        const isOffered = !!archanaProgress[key];
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
                              setArchanaProgress((prev) => {
                                const next = { ...prev };
                                // Delete rather than set false, so the map only
                                // ever holds lines that really were offered.
                                if (isOffered) delete next[key];
                                else next[key] = true;
                                return next;
                              })
                            }
                            // items-start, not items-center. The rows were laid
                            // out for a one-line name, where the two align
                            // anyway; the arghyam puts a six-line verse in the
                            // same row and centring left the number and the
                            // button floating beside line four of it.
                            className={`pt-2.5 pb-2.5 px-3 rounded-lg flex items-start gap-3 justify-between cursor-pointer transition-colors ${
                              // amber-500 is a saturated saffron in BOTH themes, so a
                              // low-opacity wash of it reads on the dark ground and on
                              // the cream one. amber-950 and stone-950 do not: each is
                              // near-white in light mode and the row tint vanished,
                              // leaving the button as the only sign of what was offered.
                              isOffered
                                ? 'bg-amber-500/15 border border-amber-500/40'
                                : 'border border-transparent hover:bg-amber-500/5'
                            }`}
                          >
                            {/* items-start here too, and min-w-0 so a long
                                unbroken line shrinks instead of pushing the
                                row wider than the phone. */}
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="text-xs font-mono font-bold w-7 shrink-0 text-amber-400/80 leading-6">
                                #{item.number || idx + 1}
                              </span>
                              <div className="min-w-0">
                                {repeatedName ? (
                                  <>
                                    <p className="text-sm md:text-base font-bold text-amber-100">
                                      {uiLang === 'ta' && item.offering_ta
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
                                    {/* whitespace-pre-line: an archana line can be
                                        more than one line. The Ksheera Arghyam
                                        verses each carry their "idam arghyam"
                                        refrain underneath, and without this the
                                        two ran together into one sentence. */}
                                    <p className="text-sm md:text-base font-bold text-amber-100 whitespace-pre-line">
                                      {mantraLang === 'tamil' && item.tamil ? item.tamil : item.sanskrit}
                                    </p>
                                    {item.translit && (
                                      <p className="text-xs text-stone-400 font-medium whitespace-pre-line">
                                        {item.translit}
                                      </p>
                                    )}
                                    {/* Anga and durva offer a different thing at each
                                        line, so the name alone is not enough. */}
                                    {item.offering_en && (
                                      <p className="text-xs text-amber-300/90 font-semibold mt-1">
                                        {uiLang === 'ta' && item.offering_ta
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
                                    {uiLang === 'ta'
                                      ? t.ifUnavailable(item.substitute_with)
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
                              {/* Not every archana line offers a flower. This
                                  list is also the leaves of the Patra Pooja, the
                                  limbs touched in the Anga Pooja and the pourings
                                  of the arghyam, and "Offer Flower" was wrong on
                                  all three. */}
                              🌸 {isOffered ? t.offered : t.offer}
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
                {t.poojaComplete}
              </h2>
              <p className="text-stone-300 text-base max-w-xl mx-auto">
                May the divine blessings of {pooja.title_en} fill your life with peace, prosperity, health, and wisdom.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 max-w-md mx-auto text-amber-300 font-serif italic text-sm">
              {uiLang === 'ta'
                ? '“ஓம் சாந்தி சாந்தி சாந்தி꞉”'
                : '“Om Shanti Shanti Shantih”'}
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
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex <= -1}
            aria-label={currentStepIndex <= 0 ? 'Back to preparation' : 'Previous step'}
            title={currentStepIndex <= 0 ? 'Back to preparation' : 'Previous step'}
            className={`px-3 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${
              currentStepIndex <= -1
                ? 'opacity-40 bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-stone-800 hover:bg-amber-950 text-amber-300 border border-amber-500/30'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            {/* Label hidden on a phone: with the bell now docked here too, four
                controls in one row wrapped the Start button onto two lines. */}
            <span className="hidden sm:inline">{t.previous}</span>
          </button>

          {/* The bell lives here rather than floating over the page. Mid-pooja
              it used to sit on top of the offering list, which is the one
              screen where you are tapping rows. */}
          <TempleBell variant="docked" />

          {/* Where you are. This used to be hidden below sm, so on a phone --
              where the step header scrolls out of sight -- there was nothing
              telling you how far through you were. */}
          <div className="text-xs font-semibold text-amber-400/90 text-center px-1">
            {currentStepIndex === -1 ? (
              <>
                <span className="hidden sm:inline">Preparation &amp; Settings</span>
                <span className="sm:hidden">Prep</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">
                  {t.stepOf(activePosition, availableSteps.length)}
                </span>
                <span className="sm:hidden tabular-nums">
                  {activePosition}/{availableSteps.length}
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleNextStep}
            disabled={!resolvedGeo && currentStepIndex === -1}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
              !resolvedGeo && currentStepIndex === -1
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50 border border-stone-700'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-ink-inverse shadow-amber-600/30'
            }`}
          >
            <span>
              {/* "last step" means the last one THIS performer and mode
                  actually do. Comparing against steps.length counted the
                  filtered-out ones, so on the Ganesha main pooja -- where
                  Udvasanam is the final row but is udvasana-only -- the button
                  never said Complete. */}
              {currentStepIndex === -1
                ? t.startPooja
                : activePosition >= availableSteps.length
                ? 'Complete Pooja'
                : t.nextStep}
            </span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PoojaViewer;
