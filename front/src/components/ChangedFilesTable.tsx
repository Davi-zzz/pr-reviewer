import React, { useState } from 'react';
import { FolderOpen, AlertCircle, AlertTriangle, Cloud, CheckCircle2, FileCode, Search } from 'lucide-react';
import { ChangedFileRisk, RiskLevel } from '../types/pr';
import { RISK_BADGE } from '../lib/format';

interface ChangedFilesTableProps {
  files: ChangedFileRisk[];
  onSelectFile?: (file: ChangedFileRisk) => void;
  selectedFileId?: string;
}

const FILTERS: (RiskLevel | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const RiskBadge: React.FC<{ level: RiskLevel | null; score: number | null }> = ({ level, score }) =>
  level ? (
    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold border ${RISK_BADGE[level]}`}>
      {level} ({score}/10)
    </span>
  ) : (
    <span
      className="font-mono text-[10px] px-2 py-0.5 rounded border border-[#31353c] text-[#968d9e]"
      title="Não avaliado (lockfile, gerado ou fora do diff enviado)"
    >
      N/A
    </span>
  );

export const ChangedFilesTable: React.FC<ChangedFilesTableProps> = ({ files, onSelectFile, selectedFileId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'ALL'>('ALL');

  const filteredFiles = files.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = f.file.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    const matchesLevel = filterLevel === 'ALL' || f.riskLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getFileIcon = (file: ChangedFileRisk) => {
    if (file.file.endsWith('.tf') || file.file.includes('infra') || file.file.includes('cloud')) {
      return <Cloud className="w-4 h-4 text-[#a2c9ff]" />;
    }
    if (file.file.includes('test')) {
      return <CheckCircle2 className="w-4 h-4 text-[#67df70]" />;
    }
    if (file.riskLevel === 'CRITICAL' || file.riskLevel === 'HIGH') {
      return <AlertCircle className="w-4 h-4 text-[#ffb4ab]" />;
    }
    if (file.riskLevel === 'MEDIUM') {
      return <AlertTriangle className="w-4 h-4 text-[#a2c9ff]" />;
    }
    return <FileCode className="w-4 h-4 text-[#ccc3d5]" />;
  };

  return (
    <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[#dfe2eb]" />
          <h3 className="text-base text-[#dfe2eb] font-semibold">Changed Files Risk Breakdown</h3>
        </div>
        <span className="text-xs text-[#968d9e] font-sans">{files.length} arquivos, mais arriscados primeiro</span>
      </div>

      {/* Search and Filters toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#968d9e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar arquivos ou risco..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 font-mono text-[11px] bg-[#0a0e14] p-0.5 rounded border border-[#31353c]">
          {FILTERS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                filterLevel === lvl ? 'bg-[#262a31] text-[#dfe2eb] font-medium' : 'text-[#968d9e] hover:text-[#dfe2eb]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div className="divide-y divide-[#31353c] border border-[#31353c] rounded overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#968d9e] bg-[#0a0e14]">
            Nenhum arquivo encontrado com estes filtros.
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFileId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile && onSelectFile(file)}
                className={`p-3 bg-[#0a0e14] flex items-center justify-between hover:bg-[#1c2026] transition-colors cursor-pointer ${
                  isSelected ? 'border-l-2 border-[#d5bbff] bg-[#1c2026]' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="shrink-0">{getFileIcon(file)}</div>
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-[#dfe2eb] font-medium truncate block">{file.file}</span>
                    <span className="text-[11px] text-[#968d9e] truncate block">{file.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-mono text-xs hidden sm:flex items-center gap-2">
                    <span className="text-[#67df70]">+{file.additions}</span>
                    <span className="text-[#ffb4ab]">-{file.deletions}</span>
                  </div>
                  <RiskBadge level={file.riskLevel} score={file.riskScore} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
