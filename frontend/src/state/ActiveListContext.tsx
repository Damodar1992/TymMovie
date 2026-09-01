import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'tym-movies-active-list-id';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

type ActiveListContextValue = {
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
};

const ActiveListContext = createContext<ActiveListContextValue | null>(null);

export function ActiveListProvider({ children }: { children: ReactNode }) {
  const [activeListId, setActiveListIdState] = useState<string | null>(readStored);

  const setActiveListId = (id: string | null) => {
    setActiveListIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <ActiveListContext.Provider value={{ activeListId, setActiveListId }}>
      {children}
    </ActiveListContext.Provider>
  );
}

export function useActiveList() {
  const ctx = useContext(ActiveListContext);
  if (!ctx) {
    throw new Error('useActiveList must be used inside ActiveListProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------
// useActiveListSync — keeps the persisted active list in sync with
// whatever lists the current user can actually see (owned + shared).
// Falls back to the user's own (owner) list the first time, or whenever
// the previously-active list disappears (e.g. the owner removed them).
// ---------------------------------------------------------------------
import { useEffect } from 'react';
import { useListsQuery, type ListSummary } from '../api/lists';

export function useActiveListSync() {
  const { activeListId, setActiveListId } = useActiveList();
  const { data: lists = [], isLoading } = useListsQuery();

  useEffect(() => {
    if (isLoading) return;
    if (lists.length === 0) return;
    const stillValid = activeListId && lists.some((l: ListSummary) => l.id === activeListId);
    if (!stillValid) {
      const ownerList = lists.find((l: ListSummary) => l.role === 'owner') ?? lists[0];
      setActiveListId(ownerList.id);
    }
  }, [lists, isLoading, activeListId, setActiveListId]);

  const activeList = lists.find((l: ListSummary) => l.id === activeListId) ?? null;
  return { lists, activeList, activeListId, setActiveListId, isLoading };
}
