import type { ApiStatus, ReviewEntry } from '../types/api';

/** Same-origin API: nginx (docker) or the vite dev proxy forwards /api */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body as T;
}

export const fetchPRs = () => request<ReviewEntry[]>('/prs');

export const fetchStatus = () => request<ApiStatus>('/status');

export const startSync = () =>
  request<{ started: boolean }>('/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
