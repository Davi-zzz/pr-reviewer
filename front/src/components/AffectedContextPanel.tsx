import React from 'react';
import {
  Share2,
  Database,
  TableProperties,
  ShieldCheck,
  FileCheck2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AffectedService } from '../types/pr';

interface AffectedContextPanelProps {
  services: AffectedService[];
  tables: string[];
  prNumber: number;
}

export const AffectedContextPanel: React.FC<AffectedContextPanelProps> = ({
  services,
  tables,
  prNumber
}) => {
  const [auditApproved, setAuditApproved] = React.useState(false);

  const getImpactBadge = (impact: AffectedService['impact']) => {
    switch (impact) {
      case 'Critical':
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-semibold border border-[#ffb4ab]/60">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#93000a]/50 text-[#ffb4ab] font-medium border border-[#ffb4ab]/40">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#262a31] text-[#a2c9ff] border border-[#31353c]">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#27a640]/15 text-[#67df70] border border-[#27a640]/30">
            Low
          </span>
        );
    }
  };

  const getDotColor = (impact: AffectedService['impact']) => {
    switch (impact) {
      case 'Critical':
      case 'High':
        return 'bg-[#ffb4ab]';
      case 'Medium':
        return 'bg-[#a2c9ff]';
      case 'Low':
      default:
        return 'bg-[#67df70]';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Affected Context Card */}
      <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#31353c] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#a2c9ff]" />
            <h3 className="text-base text-[#dfe2eb] font-semibold">
              Affected Context
            </h3>
          </div>
          <span className="font-mono text-[11px] text-[#968d9e]">
            {services.length} Services · {tables.length} Tables
          </span>
        </div>

        <p className="text-xs text-[#ccc3d5] mb-4">
          Downstream microservices and schema models impacted by this PR:
        </p>

        {/* Impacted Services List */}
        <div className="space-y-2.5">
          {services.map((service, index) => {
            const isCritical = service.impact === 'Critical';
            return (
              <div
                key={index}
                className={`p-3.5 bg-[#1c2026] rounded border transition-colors ${
                  isCritical ? 'border-[#ffb4ab]/40' : 'border-[#31353c]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(service.impact)}`} />
                      <span className="font-mono text-xs font-medium text-[#dfe2eb]">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-xs text-[#968d9e] mt-1 block leading-relaxed">
                      {service.description}
                    </span>
                  </div>
                  <div className="shrink-0">{getImpactBadge(service.impact)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Touched Database Tables */}
        <div className="mt-5 pt-4 border-t border-[#31353c]">
          <span className="font-mono text-[10px] text-[#ccc3d5] uppercase font-semibold tracking-wider block mb-2.5">
            Touched Database Tables
          </span>
          <div className="flex flex-wrap gap-2">
            {tables.map((table, index) => (
              <span
                key={index}
                className="font-mono text-xs bg-[#0a0e14] px-2.5 py-1.5 rounded text-[#dfe2eb] border border-[#31353c] flex items-center gap-1.5 hover:border-[#4a4453] transition-colors"
              >
                <TableProperties className="w-3.5 h-3.5 text-[#968d9e]" />
                {table}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reviewer Action / Audit Box */}
      <div className="bg-[#181c22] border border-[#31353c] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#d5bbff]" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#dfe2eb]">
            PR Audit & Governance
          </h4>
        </div>
        <p className="text-xs text-[#ccc3d5] mb-4 leading-relaxed">
          Verificação automatizada concluiu análise de blast radius para o PR #{prNumber}.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setAuditApproved(!auditApproved)}
            className={`w-full py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              auditApproved
                ? 'bg-[#27a640]/20 border border-[#27a640] text-[#67df70]'
                : 'bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] text-[#dfe2eb]'
            }`}
          >
            {auditApproved ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#67df70]" />
                <span>Auditoria Aprovada com Ressalvas</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4 text-[#d5bbff]" />
                <span>Validar & Assinar Auditoria</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
