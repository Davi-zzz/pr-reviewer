import React from 'react';
import { Share2, Eye } from 'lucide-react';

interface AffectedContextPanelProps {
  impactAreas: string[];
  attentionReasons: string[];
}

export const AffectedContextPanel: React.FC<AffectedContextPanelProps> = ({ impactAreas, attentionReasons }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Impacted areas */}
      <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 border-b border-[#31353c] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#a2c9ff]" />
            <h3 className="text-base text-[#dfe2eb] font-semibold">Affected Context</h3>
          </div>
          <span className="font-mono text-[11px] text-[#968d9e]">{impactAreas.length} áreas</span>
        </div>

        <p className="text-xs text-[#ccc3d5] mb-4">Partes do sistema impactadas por esta PR:</p>

        <div className="space-y-2">
          {impactAreas.map((area, index) => (
            <div key={index} className="p-3 bg-[#1c2026] rounded border border-[#31353c] flex items-start gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-[#a2c9ff]" />
              <span className="text-xs text-[#dfe2eb] leading-relaxed">{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why this attention level */}
      <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-[#d5bbff]" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#dfe2eb]">
            Por que essa atenção
          </h4>
        </div>
        {attentionReasons.length ? (
          <ul className="text-xs text-[#ccc3d5] leading-relaxed list-disc pl-4 space-y-1.5">
            {attentionReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#968d9e]">-</p>
        )}
      </div>
    </div>
  );
};
