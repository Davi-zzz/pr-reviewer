import React from 'react';
import { X, FileCode, AlertTriangle, ExternalLink } from 'lucide-react';
import { ChangedFileRisk } from '../types/pr';
import { RiskBadge } from './ChangedFilesTable';

interface FileDiffModalProps {
  file: ChangedFileRisk | null;
  prUrl: string;
  onClose: () => void;
}

export const FileDiffModal: React.FC<FileDiffModalProps> = ({ file, prUrl, onClose }) => {
  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-[#181c22] border border-[#31353c] w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#31353c] flex items-center justify-between bg-[#10141a]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <FileCode className="w-5 h-5 text-[#a2c9ff] shrink-0" />
            <h3 className="font-mono text-xs font-bold text-[#dfe2eb] truncate">{file.file}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#968d9e] hover:text-[#dfe2eb] p-1 rounded hover:bg-[#262a31] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Stats Bar */}
          <div className="flex items-center justify-between p-3 bg-[#0a0e14] rounded border border-[#31353c] flex-wrap gap-2">
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-[#968d9e]">{file.status}</span>
              <span className="text-[#67df70] font-medium">+{file.additions} linhas</span>
              <span className="text-[#ffb4ab] font-medium">-{file.deletions} linhas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#968d9e]">Risco:</span>
              <RiskBadge level={file.riskLevel} score={file.riskScore} />
            </div>
          </div>

          {/* Analysis Note */}
          <div className="p-4 bg-[#1c2026] rounded border border-[#31353c] text-xs leading-relaxed space-y-2">
            <div className="font-semibold text-[#dfe2eb] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#a2c9ff]" />
              <span>O que mudou e o que pode quebrar</span>
            </div>
            <p className="text-[#ccc3d5]">
              {file.riskLevel
                ? file.description
                : 'Este arquivo não foi avaliado (lockfile, arquivo gerado ou deixado de fora de um diff muito grande).'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#31353c] bg-[#10141a] flex justify-end gap-2">
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] rounded text-xs font-mono text-[#dfe2eb] transition-colors flex items-center gap-1.5"
          >
            Ver no Bitbucket <ExternalLink className="w-3.5 h-3.5 text-[#968d9e]" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#262a31] hover:bg-[#31353c] border border-[#31353c] rounded text-xs font-mono text-[#dfe2eb] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
