/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { StatsDisplay } from './StatsDisplay.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';

interface SessionSummaryDisplayProps {
  duration: string;
}

export const SessionSummaryDisplay: React.FC<SessionSummaryDisplayProps> = ({
  duration,
}) => {
  const { stats } = useSessionStats();

  // Only show the resume message if there were messages in the session
  const hasMessages = stats.promptCount > 0;

  return (
    <>
      <StatsDisplay
        title={t('Agent powering down. Goodbye!')}
        duration={duration}
      />
      {hasMessages && (
        <Box marginTop={1}>
          <Text color={theme.text.secondary}>
            {t('To continue this session, run')}{' '}
            <Text color={theme.text.accent}>
              qwen --resume {stats.sessionId}
            </Text>
          </Text>
        </Box>
      )}
    </>
  );
};
