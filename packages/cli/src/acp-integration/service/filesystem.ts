/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AgentSideConnection,
  FileSystemCapability,
} from '@agentclientprotocol/sdk';
import { RequestError } from '@agentclientprotocol/sdk';
import type {
  FileReadResult,
  FileSystemService,
} from '@qwen-code/qwen-code-core';

const RESOURCE_NOT_FOUND_CODE = -32002;

function getErrorCode(error: unknown): unknown {
  if (error instanceof RequestError) {
    return error.code;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: unknown }).code;
  }

  return undefined;
}

function createEnoentError(filePath: string): NodeJS.ErrnoException {
  const err = new Error(`File not found: ${filePath}`) as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  err.errno = -2;
  err.path = filePath;
  return err;
}

export class AcpFileSystemService implements FileSystemService {
  constructor(
    private readonly connection: AgentSideConnection,
    private readonly sessionId: string,
    private readonly capabilities: FileSystemCapability,
    private readonly fallback: FileSystemService,
  ) {}

  async readTextFile(filePath: string): Promise<string> {
    if (!this.capabilities.readTextFile) {
      return this.fallback.readTextFile(filePath);
    }

    let response: { content: string };
    try {
      response = await this.connection.readTextFile({
        path: filePath,
        sessionId: this.sessionId,
      });
    } catch (error) {
      const errorCode = getErrorCode(error);

      if (errorCode === RESOURCE_NOT_FOUND_CODE) {
        throw createEnoentError(filePath);
      }

      throw error;
    }

    return response.content;
  }

  async readTextFileWithInfo(filePath: string): Promise<FileReadResult> {
    if (!this.capabilities.readTextFile) {
      return this.fallback.readTextFileWithInfo(filePath);
    }

    let response: { content: string };
    try {
      response = await this.connection.readTextFile({
        path: filePath,
        sessionId: this.sessionId,
      });
    } catch (error) {
      const errorCode = getErrorCode(error);
      if (errorCode === RESOURCE_NOT_FOUND_CODE) {
        throw createEnoentError(filePath);
      }
      throw error;
    }

    const hasUtf8Bom =
      response.content.length > 0 && response.content.codePointAt(0) === 0xfeff;

    return {
      content: hasUtf8Bom ? response.content.slice(1) : response.content,
      // ACP protocol currently returns text only and does not expose source encoding.
      encoding: 'utf-8',
      bom: hasUtf8Bom,
    };
  }

  async writeTextFile(
    filePath: string,
    content: string,
    options?: { bom?: boolean; encoding?: string },
  ): Promise<void> {
    if (!this.capabilities.writeTextFile) {
      return this.fallback.writeTextFile(filePath, content, options);
    }

    const finalContent = options?.bom ? '\uFEFF' + content : content;

    await this.connection.writeTextFile({
      path: filePath,
      content: finalContent,
      sessionId: this.sessionId,
    });
  }

  async detectFileBOM(filePath: string): Promise<boolean> {
    if (this.capabilities.readTextFile) {
      try {
        const response = await this.connection.readTextFile({
          path: filePath,
          sessionId: this.sessionId,
          limit: 1,
        });
        return (
          response.content.length > 0 &&
          response.content.codePointAt(0) === 0xfeff
        );
      } catch {
        // Fall through to fallback if ACP read fails
      }
    }
    return this.fallback.detectFileBOM(filePath);
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    return this.fallback.findFiles(fileName, searchPaths);
  }
}
