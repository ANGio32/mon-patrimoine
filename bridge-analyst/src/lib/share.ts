import type { GeoData, LoadData } from '../types';

interface ShareData { v: 1; geo: GeoData; loads: LoadData; }

export function encodeShare(geo: GeoData, loads: LoadData): string {
  const data: ShareData = { v: 1, geo, loads };
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeShare(encoded: string): { geo: GeoData; loads: LoadData } | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json) as ShareData;
    if (data.v === 1 && data.geo && data.loads) return { geo: data.geo, loads: data.loads };
    return null;
  } catch { return null; }
}

export function getShareURL(geo: GeoData, loads: LoadData): string {
  const encoded = encodeShare(geo, loads);
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('share', encoded);
  return url.toString();
}
