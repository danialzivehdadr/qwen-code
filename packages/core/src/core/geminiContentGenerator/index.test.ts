/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGeminiContentGenerator } from './index.js';
import { GeminiContentGenerator } from './geminiContentGenerator.js';
import { LoggingContentGenerator } from './loggingContentGenerator.js';
import type { Config } from '../../config/config.js';
import { AuthType } from '../contentGenerator.js';

vi.mock('./geminiContentGenerator.js', () => ({
  GeminiContentGenerator: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('./loggingContentGenerator.js', () => ({
  LoggingContentGenerator: vi.fn().mockImplementation((wrapped) => wrapped),
}));

describe('createGeminiContentGenerator', () => {
  let mockConfig: Config;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      getUsageStatisticsEnabled: vi.fn().mockReturnValue(false),
      getContentGeneratorConfig: vi.fn().mockReturnValue({}),
      getCliVersion: vi.fn().mockReturnValue('1.0.0'),
    } as unknown as Config;
  });

  it('should create a GeminiContentGenerator wrapped in LoggingContentGenerator', () => {
    const config = {
      model: 'gemini-1.5-flash',
      apiKey: 'test-key',
      authType: AuthType.USE_GEMINI,
    };

    const generator = createGeminiContentGenerator(config, mockConfig);

    expect(GeminiContentGenerator).toHaveBeenCalled();
    expect(LoggingContentGenerator).toHaveBeenCalled();
    expect(generator).toBeDefined();
  });
});
