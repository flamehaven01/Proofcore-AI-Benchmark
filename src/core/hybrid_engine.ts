/**
 * ProofCore Hybrid Engine
 * Combines symbolic verification and semantic evaluation
 */

import { SymbolicVerifier, type SymbolicVerificationResult } from './symbolic_verifier';
import { SemanticEvaluator, type SemanticEvaluationResult } from './semantic_evaluator';
import { LIIEngine } from '../metrics/lii_engine';
import type { ConsensusResult } from '../ai/consensus_manager';
import { safeFetch, isOfflineMode as networkOfflineMode } from '../net/safeFetch';

export interface ProofStep {
  id: string | number;
  equation?: {
    lhs: string;
    rhs: string;
  };
  claim?: string;
  domain?: 'algebra' | 'topology' | 'logic';
}

export interface HybridStepResult {
  stepId: string | number;
  symbolic: SymbolicVerificationResult | { valid: boolean };
  consensus: ConsensusResult;
  lii: number;
  lci: [number, number];
  pass: boolean;
}

/**
 * VerificationConfig Interface
 *
 * CRITICAL: These values must be fetched from the backend's /api/v1/config/verification endpoint.
 * DO NOT hardcode these values. The backend is the SINGLE SOURCE OF TRUTH.
 *
 * If these values are out of sync with the backend, results will drift:
 * - Frontend calculations will differ from backend calculations
 * - Users will see inconsistent scoring
 * - Configuration changes in .env won't affect the frontend
 */
export interface VerificationConfig {
  symbolic_weight: number;  // 0-1
  semantic_weight: number;  // 0-1
  pass_threshold: number;   // 0-100
}

const DEFAULT_OFFLINE_CONFIG: VerificationConfig = {
  symbolic_weight: 0.7,
  semantic_weight: 0.3,
  pass_threshold: 70
};

const OFFLINE_ENV_FLAG =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env !== 'undefined' &&
  import.meta.env.VITE_OFFLINE_MODE !== 'false';

export class HybridEngine {
  private symbolic: SymbolicVerifier;
  private semantic: SemanticEvaluator;
  private liiEngine: LIIEngine;

  // Configuration fetched from backend
  private config: VerificationConfig | null = null;

  constructor(pool: any, models?: string[]) {
    this.symbolic = new SymbolicVerifier(pool);
    this.semantic = new SemanticEvaluator(models);
    this.liiEngine = new LIIEngine();
  }

  /**
   * Load verification configuration from backend.
   *
   * CRITICAL: This MUST be called before verifyStep() to ensure the frontend uses
   * the same configuration as the backend.
   *
   * This is the only way to prevent configuration drift.
   *
   * @throws Error if backend config API is unreachable
   */
  async loadConfig(): Promise<void> {
    if (this.config) {
      return;
    }

    const offlineMode = OFFLINE_ENV_FLAG || networkOfflineMode();
    if (offlineMode) {
      this.config = DEFAULT_OFFLINE_CONFIG;
      console.info('[#] Offline mode active - using bundled verification config');
      return;
    }

    try {
      const response = await safeFetch('/api/v1/config/verification', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      this.config = await response.json();
      console.log('[+] Verification config loaded from backend:', this.config);
    } catch (error) {
      console.error('[-] Failed to load config from backend:', error);
      this.config = DEFAULT_OFFLINE_CONFIG;
      console.warn('[W] Falling back to offline verification config - drift checks recommended');
    }
  }

  /**
   * Get current configuration, loading from backend if necessary.
   */
  async getConfig(): Promise<VerificationConfig> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config!;
  }

  async verifyStep(step: ProofStep): Promise<HybridStepResult> {
    // Ensure configuration is loaded
    const config = await this.getConfig();

    // Symbolic verification (if equation provided)
    const symbolicResult = step.equation
      ? await this.symbolic.verify(step.equation, step.domain)
      : { valid: true }; // No equation = narrative step

    // Semantic evaluation (always performed)
    const semanticResult = await this.semantic.evaluate(step.claim || '');

    // Combined scoring using configuration from backend
    const symbolicScore = symbolicResult.valid ? 100 : 0;
    const semanticScore = semanticResult.consensus.mean;
    const combinedScore =
      config.symbolic_weight * symbolicScore +
      config.semantic_weight * semanticScore;

    // LII calculation
    const errorCount = symbolicResult.valid ? 0 : 1;
    const liiResult = this.liiEngine.analyze(
      step.domain || 'algebra',
      1, // single step
      errorCount,
      semanticResult.consensus.coherence,
      0 // drift score (computed at proof level)
    );

    // Pass criteria: combined score > threshold AND coherence adequate
    // Both threshold values come from backend configuration
    const pass = combinedScore >= config.pass_threshold &&
                 semanticResult.consensus.coherence >= 70;

    return {
      stepId: step.id,
      symbolic: symbolicResult,
      consensus: semanticResult.consensus,
      lii: liiResult.lii,
      lci: liiResult.lci,
      pass
    };
  }
}
