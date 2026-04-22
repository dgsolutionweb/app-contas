import { useAppContext } from '../context/AppContext';

export function useDatabase() {
  const { db, isDbReady } = useAppContext();
  return { db, isReady: isDbReady };
}
