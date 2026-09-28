import React, { useState } from 'react';
import { AlertTriangle, Clock, GitFork, FileCode2, Copy, Check, Bot } from 'lucide-react';
import { PRReport } from '../types/pr';
import { ATTENTION_BADGE, RISK_BADGE, formatDateTime, timeAgo } from '../lib/format';

interface PRMetaBarProps {
  pr: PRReport;
}

export const PRMetaBar: React.FC<PRMetaBarProps> = ({ pr }) => {
  const [copiedBranch, setCopiedBranch] = useState(false);

  const handleCopyBranch = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pr.headBranch);
      setCopiedBranch(true);
      setTimeout(() => setCopiedBranch(false), 2000);
    }
  };

  return (
    <section className="border-b border-[#31353c] bg-[#181c22] px-4 md:px-6 py-3.5">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3">
        {/* Attention + risk verdict */}
        <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded font-bold border ${ATTENTION_BADGE[pr.attention]}`}>
          ATENÇÃO {pr.attention}
        </span>
        <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded font-bold border ${RISK_BADGE[pr.risk.level]}`}>
          RISCO {pr.risk.level} {pr.risk.score}/10
        </span>

        <h1 className="text-xl md:text-2xl text-[#dfe2eb] font-semibold tracking-tight">{pr.title}</h1>
      </div>

      {(pr.stale || pr.diffTruncated) && (
        <div className="max-w-[1400px] mx-auto mt-2 flex flex-wrap gap-3 text-xs text-[#ffb4ab]">
          {pr.stale && (
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Novos commits desde esta análise; ela será refeita no próximo sync.
            </span>
          )}
          {pr.diffTruncated && (
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Diff grande: a análise viu só parte dos arquivos.
            </span>
          )}
        </div>
      )}

      {/* Metadata Details Strip */}
      <div className="max-w-[1400px] mx-auto mt-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-[#ccc3d5]">
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5" title={formatDateTime(pr.openedAt)}>
            <Clock className="w-3.5 h-3.5 text-[#968d9e]" />
            <span>
              Aberta {timeAgo(pr.openedAt)} por <strong className="text-[#dfe2eb] font-medium">{pr.author}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <GitFork className="w-3.5 h-3.5 text-[#968d9e]" />
            <span className="bg-[#1c2026] px-1.5 py-0.5 rounded border border-[#31353c] text-[#dfe2eb]">
              {pr.baseBranch}
            </span>
            <span className="text-[#968d9e]">←</span>
            <span className="bg-[#1c2026] px-1.5 py-0.5 rounded border border-[#31353c] text-[#a2c9ff]">
              {pr.headBranch}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-[#968d9e]" />
              {pr.filesChangedCount} arquivos
            </span>
            <span className="text-[#67df70] font-medium">+{pr.additions}</span>
            <span className="text-[#ffb4ab] font-medium">-{pr.deletions}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#968d9e]">
            <Bot className="w-3.5 h-3.5" />
            <span>
              {pr.analyzer} · {formatDateTime(pr.analyzedAt)}
            </span>
          </div>
        </div>

        {/* Copy Branch Button */}
        <button
          onClick={handleCopyBranch}
          className="h-7 px-2.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] rounded font-mono text-xs text-[#a2c9ff] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Copiar nome da branch para a área de transferência"
        >
          {copiedBranch ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#67df70]" />
              <span className="text-[#67df70]">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Branch</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
