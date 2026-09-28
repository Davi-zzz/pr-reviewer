import React, { useState } from 'react';
import {
  X,
  Globe,
  Code,
  FileJson,
  Check,
  AlertCircle,
  Copy,
  Download,
  Terminal,
  Play
} from 'lucide-react';
import { ApiSettings } from '../services/apiService';
import { PRReport } from '../types/pr';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSaveSettings: (settings: ApiSettings) => void;
  currentPR: PRReport;
  onLoadCustomPR: (pr: PRReport) => void;
  onTestConnection: (settings: ApiSettings) => Promise<{ success: boolean; data?: PRReport; error?: string }>;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentPR,
  onLoadCustomPR,
  onTestConnection
}) => {
  const [activeTab, setActiveTab] = useState<'endpoint' | 'json' | 'docs'>('endpoint');
  
  // Endpoint form state
  const [endpoint, setEndpoint] = useState(settings.endpoint);
  const [authToken, setAuthToken] = useState(settings.authToken);
  const [customHeaderName, setCustomHeaderName] = useState(settings.customHeaderName);
  const [customHeaderValue, setCustomHeaderValue] = useState(settings.customHeaderValue);
  const [isLiveActive, setIsLiveActive] = useState(settings.isLiveApiActive);
  
  // Test status
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Direct JSON input state
  const [directJson, setDirectJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      endpoint,
      authToken,
      customHeaderName,
      customHeaderValue,
      isLiveApiActive: isLiveActive
    });
    onClose();
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await onTestConnection({
      endpoint,
      authToken,
      customHeaderName,
      customHeaderValue,
      isLiveApiActive: isLiveActive
    });

    setIsTesting(false);
    if (res.success && res.data) {
      setTestResult({
        success: true,
        message: `Sucesso! Conectado e carregado PR #${res.data.prNumber}: "${res.data.title}"`
      });
      setIsLiveActive(true);
      onLoadCustomPR(res.data);
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Falha ao conectar com o endpoint.'
      });
    }
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(directJson);
      const prData: PRReport = parsed.data || parsed;
      if (!prData.title || !prData.prNumber) {
        setJsonError('O JSON deve ter pelo menos "prNumber" e "title".');
        return;
      }
      setJsonError(null);
      setJsonSuccess(true);
      onLoadCustomPR(prData);
      setTimeout(() => {
        setJsonSuccess(false);
        onClose();
      }, 1200);
    } catch (e: any) {
      setJsonError(`Erro no JSON: ${e.message}`);
    }
  };

  const handleCopyCurrentJson = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(currentPR, null, 2));
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const sampleCurl = `curl -X GET "${endpoint || 'https://api.suaempresa.com.br/v1/pr-risk'}?pr=1842&repo=acme-corp/payment-engine" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Accept: application/json"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#181c22] border border-[#31353c] w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#31353c] flex items-center justify-between bg-[#10141a]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#d5bbff]" />
            <div>
              <h3 className="text-sm font-semibold text-[#dfe2eb]">
                Integração com sua API
              </h3>
              <p className="text-[11px] text-[#968d9e]">
                Conecte seu backend REST ou teste inserindo JSON diretamente
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

        {/* Tab navigation */}
        <div className="flex border-b border-[#31353c] bg-[#10141a] px-5 gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('endpoint')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'endpoint'
                ? 'border-[#d5bbff] text-[#d5bbff]'
                : 'border-transparent text-[#968d9e] hover:text-[#dfe2eb]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Endpoint REST
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'json'
                ? 'border-[#d5bbff] text-[#d5bbff]'
                : 'border-transparent text-[#968d9e] hover:text-[#dfe2eb]'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Colar JSON Direto
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'docs'
                ? 'border-[#d5bbff] text-[#d5bbff]'
                : 'border-transparent text-[#968d9e] hover:text-[#dfe2eb]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Esquema & cURL
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          {/* TAB 1: REST ENDPOINT CONFIG */}
          {activeTab === 'endpoint' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-[#ccc3d5] mb-1.5">
                  URL do Endpoint da API (GET)
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.empresa.com/v1/pr-analysis ou /api/pr-risk"
                  className="w-full px-3 py-2 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded font-mono text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none"
                />
                <p className="text-[11px] text-[#968d9e] mt-1">
                  Suporta parâmetros na query (<code className="font-mono text-[#a2c9ff]">?pr=1842&repo=...</code>) ou path (<code className="font-mono text-[#a2c9ff]">:pr</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#ccc3d5] mb-1.5">
                  Token de Autenticação / Bearer Token (Opcional)
                </label>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Bearer seu-jwt-token-aqui ou chave-secreta"
                  className="w-full px-3 py-2 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded font-mono text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#ccc3d5] mb-1.5">
                    Header Personalizado (Nome)
                  </label>
                  <input
                    type="text"
                    value={customHeaderName}
                    onChange={(e) => setCustomHeaderName(e.target.value)}
                    placeholder="X-Tenant-ID ou X-API-Key"
                    className="w-full px-3 py-2 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded font-mono text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-[#ccc3d5] mb-1.5">
                    Header Personalizado (Valor)
                  </label>
                  <input
                    type="text"
                    value={customHeaderValue}
                    onChange={(e) => setCustomHeaderValue(e.target.value)}
                    placeholder="valor-do-header"
                    className="w-full px-3 py-2 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded font-mono text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#31353c]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLiveActive}
                    onChange={(e) => setIsLiveActive(e.target.checked)}
                    className="rounded bg-[#0a0e14] border-[#31353c] text-[#a875fc] focus:ring-0"
                  />
                  <span className="text-xs text-[#dfe2eb]">
                    Ativar modo API ao vivo (substituir dados locais)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting || !endpoint.trim()}
                  className="px-3 py-1.5 bg-[#262a31] hover:bg-[#31353c] border border-[#31353c] rounded text-xs font-mono text-[#dfe2eb] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-[#27a640]/10 border-[#27a640]/40 text-[#67df70]'
                      : 'bg-[#93000a]/20 border-[#ffb4ab]/40 text-[#ffb4ab]'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">
                    <p className="font-semibold">{testResult.success ? 'Conexão Bem-sucedida' : 'Erro de Conexão'}</p>
                    <p className="text-[11px] mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT JSON PASTE */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#ccc3d5]">
                  Cole o payload JSON retornado pela sua API:
                </span>
                <button
                  onClick={() => setDirectJson(JSON.stringify(currentPR, null, 2))}
                  className="text-[11px] text-[#a2c9ff] hover:underline cursor-pointer"
                >
                  Carregar exemplo atual
                </button>
              </div>

              <textarea
                value={directJson}
                onChange={(e) => setDirectJson(e.target.value)}
                placeholder='{\n  "prNumber": 1842,\n  "repo": "acme-corp/payment-engine",\n  "title": "feat: meu pr...",\n  "summary": { ... }\n}'
                rows={12}
                className="w-full p-3 bg-[#0a0e14] border border-[#31353c] focus:border-[#d5bbff] rounded font-mono text-xs text-[#dfe2eb] placeholder-[#968d9e] focus:outline-none custom-scrollbar"
              />

              {jsonError && (
                <div className="p-2.5 rounded bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffb4ab] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {jsonSuccess && (
                <div className="p-2.5 rounded bg-[#27a640]/15 border border-[#27a640]/40 text-[#67df70] text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>JSON importado com sucesso! Atualizando tela...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyJson}
                disabled={!directJson.trim()}
                className="w-full py-2 bg-[#d5bbff] hover:bg-[#primary-container] text-[#39007a] font-semibold rounded text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Aplicar e Visualizar no Dashboard
              </button>
            </div>
          )}

          {/* TAB 3: API SCHEMA & CURL */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#10141a] rounded border border-[#31353c]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#dfe2eb] font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#d5bbff]" /> Exemplo de cURL para seu backend
                  </span>
                </div>
                <pre className="bg-[#0a0e14] p-2.5 rounded text-[11px] font-mono text-[#a2c9ff] overflow-x-auto custom-scrollbar">
                  <code>{sampleCurl}</code>
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#ccc3d5] font-mono font-medium">
                    Exportar JSON do PR Atual ({currentPR.repo} #{currentPR.prNumber})
                  </span>
                  <button
                    onClick={handleCopyCurrentJson}
                    className="h-7 px-2.5 bg-[#1c2026] hover:bg-[#262a31] border border-[#31353c] rounded text-[11px] font-mono text-[#dfe2eb] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="w-3 h-3 text-[#67df70]" />
                        <span className="text-[#67df70]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Esquema JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#968d9e] leading-relaxed">
                  Use esse formato como referência de resposta na sua API REST para alimentar todos os blocos de risco, diff de código e contexto arquitetural automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#31353c] bg-[#10141a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-transparent hover:bg-[#262a31] border border-transparent rounded text-xs text-[#ccc3d5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#262a31] hover:bg-[#31353c] border border-[#31353c] rounded text-xs font-mono font-medium text-[#dfe2eb] transition-colors cursor-pointer"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
