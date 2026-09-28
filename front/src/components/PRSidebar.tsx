import React, { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import type { ApiStatus } from '../types/api';
import type { AttentionLevel, PRReport } from '../types/pr';
import { ATTENTION_BAR, RISK_BADGE, formatDateTime, timeAgo } from '../lib/format';

interface PRSidebarProps {
  prs: PRReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  status: ApiStatus | null;
  onSync: () => void;
}

const LEVEL_FILTERS: { label: string; value: AttentionLevel | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Média', value: 'MEDIUM' },
  { label: 'Baixa', value: 'LOW' },
];

/** PR queue, already sorted by the API (attention, then risk score) */
export const PRSidebar: React.FC<PRSidebarProps> = ({ prs, selectedId, onSelect, status, onSync }) => {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<AttentionLevel | 'ALL'>('ALL');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prs.filter(
      (pr) =>
        (level === 'ALL' || pr.attention === level) &&
        (!q || `${pr.repo}#${pr.prNumber} ${pr.title} ${pr.author}`.toLowerCase().includes(q)),
    );
  }, [prs, query, level]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: prs.length, HIGH: 0, MEDIUM: 0, LOW: 0 };
    prs.forEach((pr) => c[pr.attention]++);
    return c;
  }, [prs]);

  const running = status?.running;
  const last = status?.lastRuns[0];

  return (
    <aside className="w-full lg:w-[340px] shrink-0 border-r border-[#31353c] bg-[#0a0e14] flex flex-col lg:h-[calc(100vh-3rem)] lg:sticky lg:top-12">
      {/* Sync status */}
      <div className="p-3 border-b border-[#31353c] space-y-2">
        <button
          onClick={onSync}
          disabled={!!running}
          className="w-full h-8 flex items-center justify-center gap-2 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] rounded text-xs font-mono text-[#dfe2eb] transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-default"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin text-[#d5bbff]' : ''}`} />
          {running ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
        <div className="text-[11px] text-[#968d9e] leading-relaxed">
          {running ? (
            <span>Iniciado {formatDateTime(running.startedAt)}</span>
          ) : last ? (
            last.status === 'ok' ? (
              <span>
                Último sync {formatDateTime(last.finishedAt)} · {last.result?.analyzed ?? 0} analisadas
                {last.result?.failed ? `, ${last.result.failed} falharam` : ''}
              </span>
            ) : (
              <span className="text-[#ffb4ab]">Último sync falhou: {last.error}</span>
            )
          ) : (
            <span>Nenhum sync ainda</span>
          )}
          <br />
          {status?.schedule ? (
            <span>Próximo automático {formatDateTime(status.schedule.nextRun)}</span>
          ) : (
            <span>Sync automático desligado (SYNC_CRON)</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-[#31353c] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#968d9e] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar repo, título, autor…"
            className="w-full pl-8 pr-3 py-1.5 bg-[#10141a] border border-[#31353c] focus:border-[#d5bbff] rounded text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none"
          />
        </div>
        <div className="flex gap-1 font-mono text-[11px]">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setLevel(f.value)}
              className={`flex-1 px-1.5 py-1 rounded border transition-colors cursor-pointer ${
                level === f.value
                  ? 'bg-[#262a31] border-[#4a4453] text-[#dfe2eb]'
                  : 'border-transparent text-[#968d9e] hover:text-[#dfe2eb]'
              }`}
            >
              {f.label} {counts[f.value]}
            </button>
          ))}
        </div>
      </div>

      {/* PR list */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#968d9e]">
            {prs.length === 0 ? 'Nenhuma PR analisada ainda. Clique em "Sincronizar agora".' : 'Nenhuma PR com esses filtros.'}
          </p>
        ) : (
          visible.map((pr) => (
            <button
              key={pr.id}
              onClick={() => onSelect(pr.id)}
              className={`w-full text-left flex border-b border-[#31353c]/60 transition-colors cursor-pointer ${
                pr.id === selectedId ? 'bg-[#1c2026]' : 'hover:bg-[#181c22]'
              }`}
            >
              <span className={`w-1 shrink-0 ${ATTENTION_BAR[pr.attention]}`} title={`Atenção ${pr.attention}`} />
              <span className="flex-1 min-w-0 px-3 py-2.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#a2c9ff] truncate">
                    {pr.repo.split('/')[1]}#{pr.prNumber}
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${RISK_BADGE[pr.risk.level]}`}>
                    {pr.risk.level} {pr.risk.score}
                  </span>
                </span>
                <span className="block text-[13px] text-[#dfe2eb] leading-snug mt-1 line-clamp-2">{pr.title}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#968d9e] mt-1">
                  <span className="truncate">{pr.author}</span>
                  <span>·</span>
                  <span className="shrink-0">{timeAgo(pr.openedAt)}</span>
                  {pr.stale && (
                    <AlertTriangle className="w-3 h-3 text-[#ffb4ab] shrink-0" aria-label="Novos commits desde a análise" />
                  )}
                </span>
              </span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
};
