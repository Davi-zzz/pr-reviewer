import React from 'react';
import { Sparkles, RefreshCw, Lightbulb, Scale, RotateCcw } from 'lucide-react';
import { PRReport } from '../types/pr';

interface AISummaryCardsProps {
  summary: PRReport['summary'];
  tags: string[];
}

export const AISummaryCards: React.FC<AISummaryCardsProps> = ({ summary, tags }) => {
  return (
    <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
      {/* Top Header & Risk Tags */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#31353c] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#d5bbff]" />
          <h2 className="text-base text-[#dfe2eb] font-semibold">
            AI PR Summary & Architectural Impact
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag, idx) => {
            const isSecurity = tag.toLowerCase().includes('security');
            const isDatabase = tag.toLowerCase().includes('database') || tag.toLowerCase().includes('financial');
            const isBreaking = tag.toLowerCase().includes('breaking') || tag.toLowerCase().includes('contract');

            let colorClasses = 'border-[#31353c] text-[#ccc3d5]';
            if (isSecurity) colorClasses = 'border-[#ffb4ab]/40 text-[#ffb4ab] bg-[#93000a]/20';
            else if (isDatabase) colorClasses = 'border-[#a2c9ff]/40 text-[#a2c9ff] bg-[#00315c]/20';
            else if (isBreaking) colorClasses = 'border-[#968d9e]/50 text-[#ccc3d5] bg-[#1c2026]';

            return (
              <span
                key={idx}
                className={`font-mono text-[10px] px-2 py-0.5 rounded border font-medium ${colorClasses}`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* 4 Architectural Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What Changed */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#d5bbff] text-sm font-medium mb-1.5">
            <RefreshCw className="w-4 h-4 text-[#d5bbff]" />
            <span>What Changed</span>
          </div>
          <p className="text-xs text-[#dfe2eb] leading-relaxed">
            {summary.whatChanged}
          </p>
        </div>

        {/* Card 2: Why It Changed */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#a2c9ff] text-sm font-medium mb-1.5">
            <Lightbulb className="w-4 h-4 text-[#a2c9ff]" />
            <span>Why It Changed</span>
          </div>
          <p className="text-xs text-[#dfe2eb] leading-relaxed">
            {summary.whyItChanged}
          </p>
        </div>

        {/* Card 3: Architectural Trade-offs */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#ffb4ab] text-sm font-medium mb-1.5">
            <Scale className="w-4 h-4 text-[#ffb4ab]" />
            <span>Architectural Trade-offs</span>
          </div>
          <p className="text-xs text-[#dfe2eb] leading-relaxed">
            {summary.architecturalTradeoffs}
          </p>
        </div>

        {/* Card 4: Rollback Strategy */}
        <div className="bg-[#1c2026] p-3.5 rounded border border-[#31353c] hover:border-[#4a4453] transition-colors">
          <div className="flex items-center gap-1.5 text-[#67df70] text-sm font-medium mb-1.5">
            <RotateCcw className="w-4 h-4 text-[#67df70]" />
            <span>Rollback Strategy</span>
          </div>
          <p className="text-xs text-[#dfe2eb] leading-relaxed">
            {summary.rollbackStrategy}
          </p>
        </div>
      </div>
    </div>
  );
};
