import React from 'react';
import { Terminal, ExternalLink } from 'lucide-react';
import { PRReport } from '../types/pr';

interface HeaderProps {
  currentPR: PRReport | null;
}

export const Header: React.FC<HeaderProps> = ({ currentPR }) => {
  return (
    <header className="h-12 w-full px-4 md:px-6 flex items-center justify-between z-40 border-b border-[#31353c] bg-[#0a0e14] sticky top-0">
      {/* Left: App name, repo and PR identifier */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#d5bbff]" />
          <span className="font-mono text-[13px] font-bold text-[#dfe2eb] tracking-tight">reviewer</span>
        </div>
        {currentPR && (
          <>
            <span className="text-[#968d9e]">/</span>
            <span className="font-mono text-[12px] text-[#ccc3d5] truncate">
              {currentPR.repo} · PR #{currentPR.prNumber}
            </span>
          </>
        )}
      </div>

      {/* Right Actions */}
      {currentPR && (
        <a
          href={currentPR.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 md:px-3 flex items-center gap-1.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] text-[#dfe2eb] font-mono text-[12px] rounded transition-colors shrink-0"
          title="Abrir este PR no Bitbucket"
        >
          <span className="hidden sm:inline">Open on Bitbucket</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#968d9e]" />
        </a>
      )}
    </header>
  );
};
