import { useEffect, useState } from 'react';
import { File, Paths } from 'expo-file-system';   // ✅ main package, not /next
import { getStops } from '../queries/stops';
import type { FeatureCollection, Point, Feature } from 'geojson';

// ---------------------------------------------------------------------------
// Cache config
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

interface CacheEnvelope {
  cachedAt: number;
  geojson: FeatureCollection<Point>;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const getCacheFile = (): File =>
  new File(Paths.cache, 'stops_cache.json');

const buildFeatureCollection = (rawData: Record<string, unknown>[]): FeatureCollection<Point> => {
  const features: Feature<Point>[] = rawData.map((s) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      // coordinate_lat holds the longitude value in this dataset
      coordinates: [Number(s.coordinate_lat), Number(s.coordinate_lon)],
    },
    properties: { ...s },
  }));
  return { type: 'FeatureCollection', features };
};

// ---------------------------------------------------------------------------
// Cache I/O
// ---------------------------------------------------------------------------

const loadFromCache = (): FeatureCollection<Point> | null => {
  const file = getCacheFile();
  if (!file.exists) return null;

  const envelope: CacheEnvelope = JSON.parse(file.textSync()); // ✅ sync read
  if (Date.now() - envelope.cachedAt > CACHE_TTL_MS) {
    console.log('[stops] Cache expired, will refresh.');
    return null;
  }

  console.log(`[stops] ${envelope.geojson.features.length} stops loaded from cache.`);
  return envelope.geojson;
};

const persistToCache = (geojson: FeatureCollection<Point>): void => {
  try {
    const envelope: CacheEnvelope = { cachedAt: Date.now(), geojson };
    getCacheFile().write(JSON.stringify(envelope)); // ✅ sync write
    console.log(`[stops] ${geojson.features.length} stops cached to disk.`);
  } catch (err) {
    console.warn('[stops] Cache write failed (non-fatal):', err);
  }
};

/** Call this to force a re-fetch on the next mount (e.g. from a settings screen). */
export const invalidateStopsCache = (): void => {
  const file = getCacheFile();
  if (file.exists) {
    file.delete();
    console.log('[stops] Cache invalidated.');
  }
};

// ---------------------------------------------------------------------------
// Network fetch
// ---------------------------------------------------------------------------

const fetchStops = async (): Promise<FeatureCollection<Point>> => {
  console.log('[stops] Fetching from Supabase…');
  const rawData = await getStops();

  if (!rawData || !Array.isArray(rawData)) {
    throw new Error('getStops() returned unexpected data');
  }

  const geojson = buildFeatureCollection(rawData);
  console.log(`[stops] Fetched ${geojson.features.length} stops from network.`);
  return geojson;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const EMPTY: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

export const useStops = () => {
  const [data, setData] = useState<FeatureCollection<Point>>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      // 1️⃣ Cache hit → set state immediately, skip network entirely
      const cached = loadFromCache();
      if (cached) {
        if (!cancelled) {
          setData(cached);
          setIsLoading(false);
        }
        return;
      }

      // 2️⃣ Cache miss / expired → fetch from Supabase
      try {
        const geojson = await fetchStops();
        if (!cancelled) setData(geojson);
        persistToCache(geojson); // sync, intentionally not awaited
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
};