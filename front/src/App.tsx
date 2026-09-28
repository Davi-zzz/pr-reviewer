/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { samplePRs } from './data/mockData';
import { PRReport, ChangedFileRisk } from './types/pr';
import {
  ApiSettings,
  loadApiSettings,
  saveApiSettings,
  fetchPRAnalysisFromApi
} from './services/apiService';
import { Header } from './components/Header';
import { PRMetaBar } from './components/PRMetaBar';
import { AISummaryCards } from './components/AISummaryCards';
import { HighestRiskZone } from './components/HighestRiskZone';
import { ChangedFilesTable } from './components/ChangedFilesTable';
import { AffectedContextPanel } from './components/AffectedContextPanel';
import { ApiConfigModal } from './components/ApiConfigModal';
import { FileDiffModal } from './components/FileDiffModal';

export default function App() {
  const [currentPR, setCurrentPR] = useState<PRReport>(samplePRs[0]);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(loadApiSettings);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ChangedFileRisk | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Sync document title with current PR
  useEffect(() => {
    document.title = `PR #${currentPR.prNumber} Impact & Risk Intelligence | ${currentPR.repo}`;
  }, [currentPR]);

  // Handle saving API settings
  const handleSaveApiSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    saveApiSettings(newSettings);
  };

  // Test connection to user's custom API
  const handleTestApiConnection = async (settings: ApiSettings) => {
    return await fetchPRAnalysisFromApi(settings, currentPR.prNumber, currentPR.repo);
  };

  // Refresh data from API if configured
  const handleRefreshFromApi = async () => {
    if (!apiSettings.endpoint.trim()) {
      setIsApiModalOpen(true);
      return;
    }

    setIsLoadingApi(true);
    const result = await fetchPRAnalysisFromApi(
      apiSettings,
      currentPR.prNumber,
      currentPR.repo
    );
    setIsLoadingApi(false);

    if (result.success && result.data) {
      setCurrentPR(result.data);
    } else {
      alert(result.error || 'Não foi possível carregar os dados da API.');
    }
  };

  return (
    <div className="bg-[#10141a] text-[#dfe2eb] font-sans antialiased min-h-screen flex flex-col selection:bg-[#a875fc] selection:text-[#39007a]">
      {/* Minimal Top Bar */}
      <Header
        currentPR={currentPR}
        onSelectPR={(pr) => setCurrentPR(pr)}
        onOpenApiSettings={() => setIsApiModalOpen(true)}
        isLiveApiActive={apiSettings.isLiveApiActive}
        onRefreshApi={handleRefreshFromApi}
        isLoading={isLoadingApi}
      />

      {/* PR Meta Bar */}
      <PRMetaBar pr={currentPR} />

      {/* Two-Column Master Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT MAIN COLUMN: Deep Code Intelligence (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* AI PR Summary & Architectural Impact */}
          <AISummaryCards
            summary={currentPR.summary}
            tags={currentPR.tags}
          />

          {/* THE HIGH-RISK CODE HIGHLIGHT ZONE */}
          <HighestRiskZone highestRisk={currentPR.highestRisk} />

          {/* Changed Files Risk Breakdown Table */}
          <ChangedFilesTable
            files={currentPR.changedFiles}
            onSelectFile={(file) => setSelectedFile(file)}
            selectedFileId={selectedFile?.id}
          />
        </div>

        {/* RIGHT ASIDE COLUMN: Affected Context (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AffectedContextPanel
            services={currentPR.affectedContext.services}
            tables={currentPR.affectedContext.touchedTables}
            prNumber={currentPR.prNumber}
          />
        </div>
      </main>

      {/* API Configuration & Testing Modal */}
      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        settings={apiSettings}
        onSaveSettings={handleSaveApiSettings}
        currentPR={currentPR}
        onLoadCustomPR={(customPR) => {
          setCurrentPR(customPR);
          setApiSettings((prev) => ({ ...prev, isLiveApiActive: true }));
        }}
        onTestConnection={handleTestApiConnection}
      />

      {/* File Diff / Risk Detail Modal */}
      <FileDiffModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}
