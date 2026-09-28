import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Clock,
  GitFork,
  GitCommit,
  FileCode2,
  Copy,
  Check
} from 'lucide-react';
import { PRReport } from '../types/pr';

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
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Top row: Status, Title, SemVer */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-[#27a640]/20 text-[#67df70] font-mono text-[11px] px-2.5 py-0.5 rounded font-bold flex items-center gap-1.5 border border-[#27a640]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#67df70]" />
            #{pr.prNumber} - {pr.status.toUpperCase()}
          </span>

          <h1 className="text-xl md:text-2xl text-[#dfe2eb] font-semibold tracking-tight">
            {pr.title}
          </h1>

          <span className="bg-[#1c2026] text-[#ccc3d5] text-[10px] font-mono px-2 py-0.5 rounded border border-[#31353c]">
            SemVer: {pr.semver}
          </span>
        </div>

        {/* Right action button */}
        <div className="flex items-center gap-2">
          <a
            href={pr.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3.5 border border-[#31353c] bg-[#1c2026] hover:bg-[#262a31] rounded text-[#dfe2eb] text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Open Original PR #{pr.prNumber} on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#968d9e]" />
          </a>
        </div>
      </div>

      {/* Metadata Details Strip */}
      <div className="max-w-[1720px] mx-auto mt-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-[#ccc3d5]">
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#968d9e]" />
            <span>
              Opened {pr.openedAt} by{' '}
              <strong className="text-[#dfe2eb] font-medium">@{pr.author}</strong>
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
              <GitCommit className="w-3.5 h-3.5 text-[#968d9e]" />
              {pr.commitsCount} commits
            </span>
            <span className="flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-[#968d9e]" />
              {pr.filesChangedCount} files changed
            </span>
            <span className="text-[#67df70] font-medium">+{pr.additions}</span>
            <span className="text-[#ffb4ab] font-medium">-{pr.deletions}</span>
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
