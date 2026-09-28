import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, Wand2, Copy, Check, Code2 } from 'lucide-react';
import { HighestRiskBlock } from '../types/pr';

interface HighestRiskZoneProps {
  highestRisk: HighestRiskBlock;
}

export const HighestRiskZone: React.FC<HighestRiskZoneProps> = ({ highestRisk }) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'fix'>('diff');
  const [copiedPatch, setCopiedPatch] = useState(false);

  const handleCopyPatch = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(highestRisk.suggestedFix.code);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  return (
    <div className="border-2 border-[#ffb4ab]/80 bg-[#0a0e14] rounded-lg overflow-hidden shadow-lg shadow-[#ffb4ab]/5">
      {/* Banner alert */}
      <div className="bg-[#93000a] text-[#ffdad6] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 border-b border-[#ffb4ab]/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#ffdad6]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Highest Risk Code Block
          </span>
          <span className="font-mono text-xs bg-[#0a0e14] text-[#ffb4ab] px-2 py-0.5 rounded border border-[#ffb4ab]/40">
            {highestRisk.file}:{highestRisk.lineRange}
          </span>
        </div>
      </div>

      {/* Issue Diagnosis */}
      <div className="p-4 bg-[#181c22] border-b border-[#31353c] flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-[#ffb4ab] shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-semibold text-[#ffb4ab]">
            {highestRisk.hazardType}
          </span>{' '}
          <span className="text-xs text-[#dfe2eb] leading-relaxed block mt-0.5">
            {highestRisk.hazardDescription}
          </span>
        </div>
      </div>

      {/* Diff Viewer Controls */}
      <div className="bg-[#1c2026] px-4 py-2 border-b border-[#31353c] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Code2 className="w-4 h-4 text-[#968d9e]" />
          <span className="text-[#dfe2eb] font-medium">{highestRisk.file}</span>
          <span className="text-[#968d9e]">|</span>
          <span className="text-[#67df70]">+{highestRisk.additions} lines</span>
          <span className="text-[#ffb4ab]">-{highestRisk.deletions} lines</span>
        </div>

        {/* Tab switch: Diff vs AI Suggested Fix */}
        <div className="flex items-center gap-1 bg-[#0a0e14] p-0.5 rounded border border-[#31353c] text-xs">
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
              activeTab === 'diff'
                ? 'bg-[#262a31] text-[#dfe2eb] font-medium shadow-sm'
                : 'text-[#ccc3d5] hover:text-[#dfe2eb]'
            }`}
          >
            Code Diff
          </button>
          <button
            onClick={() => setActiveTab('fix')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'fix'
                ? 'bg-[#262a31] text-[#d5bbff] font-medium shadow-sm'
                : 'text-[#d5bbff]/80 hover:text-[#d5bbff]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Suggested Fix</span>
          </button>
        </div>
      </div>

      {/* Live Diff View */}
      {activeTab === 'diff' && (
        // One horizontal scroll for the whole block; rows are as wide as the longest line
        <div className="font-mono text-xs leading-5 overflow-x-auto custom-scrollbar bg-[#0a0e14]">
          <div className="min-w-full w-max">
          {highestRisk.diffLines.length === 0 && (
            <p className="p-4 font-sans text-[#968d9e]">
              Não foi possível localizar essas linhas no diff; veja o arquivo no Bitbucket.
            </p>
          )}
          {highestRisk.diffLines.map((line, index) => {
            const isDeletion = line.type === 'deletion';
            const isAddition = line.type === 'addition';

            return (
              <div
                key={index}
                className={`flex items-stretch hover:bg-[#262a31]/40 ${
                  isDeletion ? 'bg-[#93000a]/15 text-[#ffb4ab]' : ''
                } ${isAddition ? 'bg-[#27a640]/10 text-[#dfe2eb]' : ''}`}
              >
                {/* Old line number */}
                <div className="w-12 py-0.5 pr-3 text-right text-[#968d9e] select-none text-[11px] border-r border-[#31353c] bg-[#181c22]/40 shrink-0">
                  {line.oldLineNumber || ''}
                </div>

                {/* New line number */}
                <div className="w-12 py-0.5 pr-3 text-right text-[#968d9e] select-none text-[11px] border-r border-[#31353c] bg-[#181c22]/40 shrink-0">
                  {line.newLineNumber || ''}
                </div>

                {/* Symbol */}
                <div
                  className={`w-6 text-center select-none font-bold shrink-0 ${
                    isDeletion ? 'text-[#ffb4ab] bg-[#93000a]/20' : ''
                  } ${isAddition ? 'text-[#67df70]' : ''}`}
                >
                  {isDeletion ? '-' : isAddition ? '+' : ' '}
                </div>

                {/* Content */}
                <div className="px-3 py-0.5 flex-1 whitespace-pre">
                  {line.content}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* AI Suggested Fix View */}
      {activeTab === 'fix' && (
        <div className="font-mono text-xs leading-5 p-4 bg-[#0a0e14] border-t border-[#31353c]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs text-[#67df70] font-semibold flex items-center gap-1.5 font-sans">
              <Check className="w-4 h-4 text-[#67df70]" />
              {highestRisk.suggestedFix.title}
            </span>

            <button
              onClick={handleCopyPatch}
              className="h-7 px-2.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] rounded text-xs text-[#dfe2eb] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedPatch ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#67df70]" />
                  <span className="text-[#67df70]">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Patch</span>
                </>
              )}
            </button>
          </div>

          <pre className="text-[#67df70] bg-[#181c22] p-3.5 rounded border border-[#31353c] overflow-x-auto custom-scrollbar font-mono text-xs leading-relaxed">
            <code>{highestRisk.suggestedFix.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
