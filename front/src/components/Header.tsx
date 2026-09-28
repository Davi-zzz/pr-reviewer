import React, { useState } from 'react';
import { Terminal, ExternalLink, Check, ChevronDown } from 'lucide-react';
import { PRReport } from '../types/pr';
import { samplePRs } from '../data/mockData';

interface HeaderProps {
  currentPR: PRReport;
  onSelectPR: (pr: PRReport) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPR, onSelectPR }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-12 w-full px-4 md:px-6 flex items-center justify-between z-40 border-b border-[#31353c] bg-[#0a0e14] sticky top-0">
      {/* Left: Repo and PR identifier */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#d5bbff]" />
          <span className="font-mono text-[13px] font-bold text-[#dfe2eb] tracking-tight">
            {currentPR.repo}
          </span>
        </div>
        <span className="text-[#968d9e]">/</span>
        
        {/* PR selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 font-mono text-[12px] text-[#ccc3d5] hover:text-[#dfe2eb] hover:bg-[#1c2026] px-2 py-1 rounded transition-colors"
            title="Selecionar ou alternar PR"
          >
            <span>PR #{currentPR.prNumber}</span>
            <ChevronDown className="w-3 h-3 text-[#968d9e]" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-72 bg-[#181c22] border border-[#31353c] rounded shadow-xl z-50 py-1 font-sans text-xs">
                <div className="px-3 py-1.5 text-[10px] font-mono text-[#968d9e] uppercase tracking-wider border-b border-[#31353c]">
                  Selecionar Pull Request
                </div>
                {samplePRs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => {
                      onSelectPR(pr);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-[#262a31] transition-colors ${
                      pr.prNumber === currentPR.prNumber ? 'bg-[#1c2026] text-[#d5bbff]' : 'text-[#dfe2eb]'
                    }`}
                  >
                    <span className="font-mono text-[#a2c9ff] shrink-0 font-medium">#{pr.prNumber}</span>
                    <span className="truncate flex-1">{pr.title}</span>
                    {pr.prNumber === currentPR.prNumber && (
                      <Check className="w-3.5 h-3.5 text-[#d5bbff] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Bitbucket Link */}
        <a
          href={currentPR.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 md:px-3 flex items-center gap-1.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] text-[#dfe2eb] font-mono text-[12px] rounded transition-colors"
          title="Abrir este PR no Bitbucket"
        >
          <span className="hidden sm:inline">Open on Bitbucket</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#968d9e]" />
        </a>
      </div>
    </header>
  );
};
