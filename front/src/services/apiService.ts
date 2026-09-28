import { PRReport } from '../types/pr';
import { samplePRs } from '../data/mockData';

const STORAGE_KEY_API_CONFIG = 'pr_sentinel_api_config';
const STORAGE_KEY_CURRENT_PR = 'pr_sentinel_current_pr';

export interface ApiSettings {
  endpoint: string;
  authToken: string;
  customHeaderName: string;
  customHeaderValue: string;
  isLiveApiActive: boolean;
}

export const defaultApiSettings: ApiSettings = {
  endpoint: '',
  authToken: '',
  customHeaderName: '',
  customHeaderValue: '',
  isLiveApiActive: false
};

export function loadApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_API_CONFIG);
    if (raw) {
      return { ...defaultApiSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading API settings from localStorage:', e);
  }
  return defaultApiSettings;
}

export function saveApiSettings(settings: ApiSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving API settings:', e);
  }
}

export async function fetchPRAnalysisFromApi(
  settings: ApiSettings,
  prNumber: number,
  repo: string
): Promise<{ success: boolean; data?: PRReport; error?: string }> {
  if (!settings.endpoint.trim()) {
    return { success: false, error: 'URL do endpoint da API não configurada.' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (settings.authToken.trim()) {
      headers['Authorization'] = settings.authToken.startsWith('Bearer ')
        ? settings.authToken
        : `Bearer ${settings.authToken}`;
    }

    if (settings.customHeaderName.trim() && settings.customHeaderValue.trim()) {
      headers[settings.customHeaderName.trim()] = settings.customHeaderValue.trim();
    }

    // Determine query or url format
    let targetUrl = settings.endpoint.trim();
    if (targetUrl.includes(':pr')) {
      targetUrl = targetUrl.replace(':pr', prNumber.toString());
    } else if (targetUrl.includes('{pr}')) {
      targetUrl = targetUrl.replace('{pr}', prNumber.toString());
    } else {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}pr=${encodeURIComponent(prNumber)}&repo=${encodeURIComponent(repo)}`;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      return {
        success: false,
        error: `A API retornou erro HTTP ${response.status}: ${response.statusText}`
      };
    }

    const result = await response.json();
    // Validate if result is direct PRReport or wrapped in { data: ... }
    const prData: PRReport = result.data || result;

    if (!prData.title || !prData.prNumber) {
      return {
        success: false,
        error: 'O JSON retornado não contém os campos mínimos obrigatórios (prNumber, title).'
      };
    }

    return { success: true, data: prData };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha na requisição: ${err.message || 'Verifique se o CORS está liberado na sua API ou se o endereço é válido.'}`
    };
  }
}

export function validateAndParsePRJson(jsonString: string): { success: boolean; data?: PRReport; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const data: PRReport = parsed.data || parsed;

    if (!data.title || !data.prNumber) {
      return {
        success: false,
        error: 'O JSON deve conter pelo menos os campos "prNumber" e "title".'
      };
    }

    // Provide safe defaults for nested objects if missing
    const sanitized: PRReport = {
      id: data.id || `pr-${data.prNumber}`,
      prNumber: Number(data.prNumber),
      repo: data.repo || 'owner/repo',
      title: data.title,
      status: data.status || 'open',
      semver: data.semver || 'MINOR',
      openedAt: data.openedAt || 'recentemente',
      author: data.author || 'dev',
      baseBranch: data.baseBranch || 'main',
      headBranch: data.headBranch || 'feature/branch',
      commitsCount: data.commitsCount ?? 1,
      filesChangedCount: data.filesChangedCount ?? 1,
      additions: data.additions ?? 0,
      deletions: data.deletions ?? 0,
      githubUrl: data.githubUrl || '#',
      tags: Array.isArray(data.tags) ? data.tags : ['[Automated-Analysis]'],
      summary: data.summary || {
        whatChanged: 'Descrição das mudanças introduzidas no PR.',
        whyItChanged: 'Motivo da alteração ou referência de issue/RFC.',
        architecturalTradeoffs: 'Impactos de performance, consistência ou infraestrutura.',
        rollbackStrategy: 'Estratégia de reversão ou flags de contingência.'
      },
      highestRisk: data.highestRisk || {
        file: 'main.ts',
        lineRange: '1-10',
        riskWeight: 50,
        hazardType: 'POTENTIAL IMPACT:',
        hazardDescription: 'Revise as linhas de código modificadas.',
        additions: 10,
        deletions: 2,
        diffLines: [],
        suggestedFix: {
          title: 'Correção sugerida',
          code: '// Código corrigido aqui'
        }
      },
      changedFiles: Array.isArray(data.changedFiles) ? data.changedFiles : [],
      affectedContext: data.affectedContext || {
        services: [],
        touchedTables: []
      }
    };

    return { success: true, data: sanitized };
  } catch (e: any) {
    return { success: false, error: `JSON Inválido: ${e.message}` };
  }
}
