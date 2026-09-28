import React from 'react';
import { X, FileCode, AlertTriangle, CheckCircle2, Cloud, AlertCircle } from 'lucide-react';
import { ChangedFileRisk } from '../types/pr';

interface FileDiffModalProps {
  file: ChangedFileRisk | null;
  onClose: () => void;
}

export const FileDiffModal: React.FC<FileDiffModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#181c22] border border-[#31353c] w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#31353c] flex items-center justify-between bg-[#10141a]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <FileCode className="w-5 h-5 text-[#a2c9ff] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-mono text-xs font-bold text-[#dfe2eb] truncate">
                {file.file}
              </h3>
              <p className="text-[11px] text-[#968d9e] truncate">
                {file.description}
              </p>
            </div>
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
              <span className="text-[#968d9e]">Diff:</span>
              <span className="text-[#67df70] font-medium">+{file.additions} linhas</span>
              <span className="text-[#ffb4ab] font-medium">-{file.deletions} linhas</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#968d9e]">Hazard Score:</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/60">
                {file.riskLevel} ({file.riskScore}/100)
              </span>
            </div>
          </div>

          {/* Analysis Note */}
          <div className="p-4 bg-[#1c2026] rounded border border-[#31353c] text-xs leading-relaxed space-y-2">
            <div className="font-semibold text-[#dfe2eb] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#a2c9ff]" />
              <span>Análise Estática & Impacto em Tempo de Execução</span>
            </div>
            <p className="text-[#ccc3d5]">
              Este arquivo contém alterações relacionadas a <strong>{file.description}</strong>. A pontuação de risco leva em consideração a sensibilidade das rotas de chamada, concorrência distribuída e impacto nos contratos de API.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#31353c] bg-[#10141a] flex justify-end">
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
