import { type OpenAiTool } from '../types';

export function createWebSearchToolPreview(): OpenAiTool {
  return { type: 'web_search_preview' };
}

