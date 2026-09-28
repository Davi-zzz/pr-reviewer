import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChangedFileRisk } from './types/pr';
import type { ApiStatus } from './types/api';
import { fetchPRs, fetchStatus, startSync } from './services/api';
import { toPRReport } from './services/adapter';
import { Header } from './components/Header';
import { PRSidebar } from './components/PRSidebar';
import { PRMetaBar } from './components/PRMetaBar';
import { AISummaryCards } from './components/AISummaryCards';
import { HighestRiskZone } from './components/HighestRiskZone';
import { ChangedFilesTable } from './components/ChangedFilesTable';
import { AffectedContextPanel } from './components/AffectedContextPanel';
import { FileDiffModal } from './components/FileDiffModal';

const POLL_WHILE_SYNCING_MS = 3000;

export default function App() {
  const [entries, setEntries] = useState<ReturnType<typeof toPRReport>[]>([]);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ChangedFileRisk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wasRunning = useRef(false);

  const loadPRs = useCallback(async () => {
    try {
      const prs = (await fetchPRs()).map(toPRReport);
      setEntries(prs);
      // Keep the current selection if it still exists, otherwise open the most urgent PR
      setSelectedId((current) => (current && prs.some((p) => p.id === current) ? current : (prs[0]?.id ?? null)));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchStatus();
      setStatus(s);
      // A sync just finished: fetch the new results
      if (wasRunning.current && !s.running) loadPRs();
      wasRunning.current = !!s.running;
    } catch {
      setStatus(null);
    }
  }, [loadPRs]);

  useEffect(() => {
    loadPRs();
    loadStatus();
  }, [loadPRs, loadStatus]);

  // Follow a running sync (manual or scheduled)
  useEffect(() => {
    if (!status?.running) return;
    const timer = setInterval(loadStatus, POLL_WHILE_SYNCING_MS);
    return () => clearInterval(timer);
  }, [status?.running, loadStatus]);

  const handleSync = async () => {
    try {
      await startSync();
    } catch (err) {
      alert((err as Error).message);
    }
    loadStatus();
  };

  const currentPR = useMemo(() => entries.find((p) => p.id === selectedId) ?? null, [entries, selectedId]);

  useEffect(() => {
    setSelectedFile(null);
    document.title = currentPR ? `#${currentPR.prNumber} ${currentPR.title} | reviewer` : 'reviewer';
  }, [currentPR]);

  return (
    <div className="bg-[#10141a] text-[#dfe2eb] font-sans antialiased min-h-screen flex flex-col selection:bg-[#a875fc] selection:text-[#39007a]">
      <Header currentPR={currentPR} />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <PRSidebar
          prs={entries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          status={status}
          onSync={handleSync}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {error ? (
            <p className="m-auto p-10 text-sm text-[#ffb4ab]">Não foi possível falar com a API: {error}</p>
          ) : loading ? (
            <p className="m-auto p-10 text-sm text-[#968d9e]">Carregando…</p>
          ) : !currentPR ? (
            <p className="m-auto p-10 text-sm text-[#968d9e]">Selecione uma PR na lista.</p>
          ) : (
            <>
              <PRMetaBar pr={currentPR} />

              <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Main column: summary, riskiest block, files */}
                <div className="xl:col-span-8 flex flex-col gap-6 min-w-0">
                  <AISummaryCards summary={currentPR.summary} tags={currentPR.tags} />

                  {currentPR.highestRisk && <HighestRiskZone highestRisk={currentPR.highestRisk} />}

                  <ChangedFilesTable
                    files={currentPR.changedFiles}
                    onSelectFile={setSelectedFile}
                    selectedFileId={selectedFile?.id}
                  />
                </div>

                {/* Side column: affected context */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  <AffectedContextPanel
                    impactAreas={currentPR.impactAreas}
                    attentionReasons={currentPR.attentionReasons}
                  />
                </div>
              </main>

              <FileDiffModal file={selectedFile} prUrl={currentPR.prUrl} onClose={() => setSelectedFile(null)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
