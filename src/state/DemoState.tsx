import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { demoRuntime } from '../app/runtime';

interface DemoStateValue {
  preferredCounties: string[];
  setPreferredCounties: (counties: string[]) => void;
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  resetDemo: () => void;
}

const DemoStateContext = createContext<DemoStateValue | null>(null);
const storageKey = 'benchbridge-von-demo-state';

function readStoredState(): Pick<DemoStateValue, 'preferredCounties' | 'savedIds'> {
  const defaults = {
    preferredCounties: demoRuntime.repositories.workers.getDemoWorker().preferredCounties,
    savedIds: [],
  };
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<typeof defaults>;
    return {
      preferredCounties: Array.isArray(parsed.preferredCounties) ? parsed.preferredCounties : defaults.preferredCounties,
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : defaults.savedIds,
    };
  } catch {
    return defaults;
  }
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const initial = readStoredState();
  const [preferredCounties, setPreferredCounties] = useState(initial.preferredCounties);
  const [savedIds, setSavedIds] = useState(initial.savedIds);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ preferredCounties, savedIds }));
  }, [preferredCounties, savedIds]);

  const value = useMemo<DemoStateValue>(
    () => ({
      preferredCounties,
      setPreferredCounties,
      savedIds,
      isSaved: (id) => savedIds.includes(id),
      toggleSaved: (id) => setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
      resetDemo: () => {
        setPreferredCounties(demoRuntime.repositories.workers.getDemoWorker().preferredCounties);
        setSavedIds([]);
        localStorage.removeItem(storageKey);
      },
    }),
    [preferredCounties, savedIds],
  );

  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>;
}

export function useDemoState(): DemoStateValue {
  const context = useContext(DemoStateContext);
  if (!context) throw new Error('useDemoState must be used within DemoStateProvider.');
  return context;
}
