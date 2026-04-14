import { useEffect, useState, useRef } from "react";
import { api, publicApi } from "./api/axios";

/**
 * Generic hook that fetches data.
 * Uses `publicApi` for public routes (/menu) and `api` for protected routes.
 */
export function useFetchWithState<T>(
  url: string,
  fetcher?: () => Promise<T>,
  refreshInterval: number = 0
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  // Keep track of the latest fetcher without triggering the effect
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      let payload: any;
      if (fetcherRef.current) {
        payload = await fetcherRef.current();
      } else {
        const client = url.startsWith("/menu") ? publicApi : api;
        const res = await client.get(url);
        payload = res.data?.data ?? res.data;
      }
      
      if (Array.isArray(payload) && payload.length === 0) {
        setEmpty(true);
        setData(null);
      } else {
        setData(payload);
        setEmpty(false);
      }
    } catch (e: any) {
      let errMsg = "Error de conexión";
      const apiMsg = e.response?.data?.message;
      if (typeof apiMsg === "string") errMsg = apiMsg;
      else if (apiMsg && typeof apiMsg === "object") errMsg = apiMsg.message || JSON.stringify(apiMsg);
      else if (e.message) errMsg = e.message;
      setError(String(errMsg));
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let intervalId: any = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => fetchData(true), refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, refreshInterval]);

  return { data, setData, loading, error, empty, refetch: () => fetchData(false) };
}
