import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { MovieStatus, MoviesQueryParams } from '../api/movies';

export type ViewMode = 'cards' | 'table';
export type TitleLang = 'en' | 'ua';

const VIEW_STORAGE_KEY = 'tym-movies-view';
const TITLE_LANG_STORAGE_KEY = 'tym-movies-title-lang';

function readView(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v === 'cards' || v === 'table') return v;
  } catch {
    /* ignore */
  }
  return 'cards';
}

function readTitleLang(): TitleLang {
  try {
    const v = localStorage.getItem(TITLE_LANG_STORAGE_KEY);
    if (v === 'en' || v === 'ua') return v;
  } catch {
    /* ignore */
  }
  return 'en';
}

export type MoviesFiltersContextValue = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  status: MovieStatus | undefined;
  setStatus: Dispatch<SetStateAction<MovieStatus | undefined>>;
  contentType: 'MOVIE' | 'TV' | undefined;
  setContentType: Dispatch<SetStateAction<'MOVIE' | 'TV' | undefined>>;
  genres: string[];
  setGenres: Dispatch<SetStateAction<string[]>>;
  sortBy: MoviesQueryParams['sortBy'];
  setSortBy: Dispatch<SetStateAction<MoviesQueryParams['sortBy']>>;
  sortOrder: MoviesQueryParams['sortOrder'];
  setSortOrder: Dispatch<SetStateAction<MoviesQueryParams['sortOrder']>>;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  titleLang: TitleLang;
  setTitleLang: (v: TitleLang) => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  clearAll: () => void;
};

const MoviesFiltersContext = createContext<MoviesFiltersContextValue | null>(
  null,
);

export function MoviesFiltersProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MovieStatus | undefined>();
  const [contentType, setContentType] = useState<'MOVIE' | 'TV' | undefined>();
  const [genres, setGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] =
    useState<MoviesQueryParams['sortBy']>('created_at');
  const [sortOrder, setSortOrder] =
    useState<MoviesQueryParams['sortOrder']>('desc');
  const [viewModeState, setViewModeState] = useState<ViewMode>(readView);
  const [titleLangState, setTitleLangState] = useState<TitleLang>(readTitleLang);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status, contentType, genres, sortBy, sortOrder]);

  const setViewMode = useCallback((v: ViewMode) => {
    setViewModeState(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setTitleLang = useCallback((v: TitleLang) => {
    setTitleLangState(v);
    try {
      localStorage.setItem(TITLE_LANG_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const clearAll = useCallback(() => {
    setStatus(undefined);
    setContentType(undefined);
    setGenres([]);
  }, []);

  const value = useMemo<MoviesFiltersContextValue>(
    () => ({
      search,
      setSearch,
      status,
      setStatus,
      contentType,
      setContentType,
      genres,
      setGenres,
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder,
      viewMode: viewModeState,
      setViewMode,
      titleLang: titleLangState,
      setTitleLang,
      page,
      setPage,
      clearAll,
    }),
    [
      search,
      status,
      contentType,
      genres,
      sortBy,
      sortOrder,
      viewModeState,
      setViewMode,
      titleLangState,
      setTitleLang,
      page,
      clearAll,
    ],
  );

  return (
    <MoviesFiltersContext.Provider value={value}>
      {children}
    </MoviesFiltersContext.Provider>
  );
}

export function useMoviesFilters(): MoviesFiltersContextValue {
  const ctx = useContext(MoviesFiltersContext);
  if (!ctx) {
    throw new Error(
      'useMoviesFilters must be used inside <MoviesFiltersProvider>',
    );
  }
  return ctx;
}
