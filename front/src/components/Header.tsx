import React, { useState } from 'react';
import { Terminal, ExternalLink, Settings2, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { PRReport } from '../types/pr';
import { samplePRs } from '../data/mockData';

interface HeaderProps {
  currentPR: PRReport;
  onSelectPR: (pr: PRReport) => void;
  onOpenApiSettings: () => void;
  isLiveApiActive: boolean;
  onRefreshApi?: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPR,
  onSelectPR,
  onOpenApiSettings,
  isLiveApiActive,
  onRefreshApi,
  isLoading
}) => {
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
        {/* API Integration Button */}
        <button
          onClick={onOpenApiSettings}
          className={`h-8 px-2.5 md:px-3 flex items-center gap-1.5 border rounded font-mono text-[11px] transition-all ${
            isLiveApiActive
              ? 'bg-[#1c2026] border-[#27a640]/60 text-[#67df70] hover:bg-[#262a31]'
              : 'bg-[#181c22] border-[#31353c] text-[#ccc3d5] hover:text-[#dfe2eb] hover:bg-[#262a31]'
          }`}
          title="Configurar integração com sua API REST"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveApiActive ? 'bg-[#67df70] animate-pulse' : 'bg-[#968d9e]'
              }`}
            />
          </div>
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isLiveApiActive ? 'API Conectada' : 'Integrar API'}
          </span>
        </button>

        {isLiveApiActive && onRefreshApi && (
          <button
            onClick={onRefreshApi}
            disabled={isLoading}
            className="h-8 px-2 flex items-center justify-center bg-[#181c22] border border-[#31353c] rounded text-[#ccc3d5] hover:text-[#dfe2eb] hover:bg-[#262a31] transition-colors disabled:opacity-50"
            title="Recarregar dados da API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#d5bbff]' : ''}`} />
          </button>
        )}

        {/* GitHub Link */}
        <a
          href={currentPR.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 md:px-3 flex items-center gap-1.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] text-[#dfe2eb] font-mono text-[12px] rounded transition-colors"
          title="Abrir este PR no GitHub"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="hidden sm:inline">Open on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#968d9e]" />
        </a>
      </div>
    </header>
  );
};
