import React from 'react';
import { Sparkles, RefreshCw, Lightbulb, ShieldAlert, ListChecks } from 'lucide-react';
import { PRReport } from '../types/pr';

interface AISummaryCardsProps {
  summary: PRReport['summary'];
  tags: string[];
}

const List: React.FC<{ items: string[]; empty: string }> = ({ items, empty }) =>
  items.length ? (
    <ul className="text-xs text-[#dfe2eb] leading-relaxed list-disc pl-4 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="text-xs text-[#968d9e]">{empty}</p>
  );

export const AISummaryCards: React.FC<AISummaryCardsProps> = ({ summary, tags }) => {
  return (
    <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
      {/* Top Header & Sensitive-area Tags */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#31353c] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#d5bbff]" />
          <h2 className="text-base text-[#dfe2eb] font-semibold">AI PR Summary</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => {
            const t = tag.toLowerCase();
            const isSecurity = t.includes('auth') || t.includes('payments');
            const isDatabase = t.includes('migrations') || t.includes('config');
            const colorClasses = isSecurity
              ? 'border-[#ffb4ab]/40 text-[#ffb4ab] bg-[#93000a]/20'
              : isDatabase
                ? 'border-[#a2c9ff]/40 text-[#a2c9ff] bg-[#00315c]/20'
                : 'border-[#968d9e]/50 text-[#ccc3d5] bg-[#1c2026]';
            return (
              <span key={tag} className={`font-mono text-[10px] px-2 py-0.5 rounded border font-medium ${colorClasses}`}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What Changed */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#d5bbff] text-sm font-medium mb-1.5">
            <RefreshCw className="w-4 h-4 text-[#d5bbff]" />
            <span>What Changed</span>
          </div>
          <p className="text-xs text-[#dfe2eb] leading-relaxed">{summary.whatChanged}</p>
        </div>

        {/* Card 2: Why — the author's own description */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#a2c9ff] text-sm font-medium mb-1.5">
            <Lightbulb className="w-4 h-4 text-[#a2c9ff]" />
            <span>Why (PR description)</span>
          </div>
          {summary.whyItChanged ? (
            <p className="text-xs text-[#dfe2eb] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto custom-scrollbar">
              {summary.whyItChanged}
            </p>
          ) : (
            <p className="text-xs text-[#968d9e]">O autor não escreveu descrição.</p>
          )}
        </div>

        {/* Card 3: Risk Factors */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#ffb4ab] text-sm font-medium mb-1.5">
            <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" />
            <span>Risk Factors</span>
          </div>
          <List items={summary.riskFactors} empty="Nenhum fator de risco apontado." />
        </div>

        {/* Card 4: Review First */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#67df70] text-sm font-medium mb-1.5">
            <ListChecks className="w-4 h-4 text-[#67df70]" />
            <span>Review First</span>
          </div>
          <List items={summary.reviewFocus} empty="Nada específico para olhar primeiro." />
        </div>
      </div>
    </div>
  );
};
