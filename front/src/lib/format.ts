import type { AttentionLevel, RiskLevel } from '../types/pr';

/** Badge colors per level, in the dashboard's palette */
export const RISK_BADGE: Record<RiskLevel, string> = {
  CRITICAL: 'bg-[#93000a] text-[#ffdad6] border-[#ffb4ab]/80',
  HIGH: 'bg-[#93000a]/60 text-[#ffb4ab] border-[#ffb4ab]/50',
  MEDIUM: 'bg-[#31353c] text-[#a2c9ff] border-[#a2c9ff]/40',
  LOW: 'bg-[#27a640]/15 text-[#67df70] border-[#27a640]/40',
};

export const ATTENTION_BADGE: Record<AttentionLevel, string> = {
  HIGH: 'bg-[#93000a]/60 text-[#ffb4ab] border-[#ffb4ab]/50',
  MEDIUM: 'bg-[#31353c] text-[#a2c9ff] border-[#a2c9ff]/40',
  LOW: 'bg-[#27a640]/15 text-[#67df70] border-[#27a640]/40',
};

export const ATTENTION_BAR: Record<AttentionLevel, string> = {
  HIGH: 'bg-[#ffb4ab]',
  MEDIUM: 'bg-[#a2c9ff]',
  LOW: 'bg-[#67df70]',
};

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 60) return `há ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}
