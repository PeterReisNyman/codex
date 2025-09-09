import { objectSchema, type OpenAiTool } from '../types';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

export type ViewImageArgs = { path: string };

export function createViewImageTool(): OpenAiTool {
  return {
    type: 'function',
    name: 'view_image',
    description: 'Attach a local image (by filesystem path) to the conversation context for this turn.',
    strict: false,
    parameters: objectSchema(
      {
        path: { type: 'string', description: 'Local filesystem path to an image file' },
      },
      ['path'],
    ),
  };
}

export type ViewImageResult = { dataUrl: string; bytes: number };

export function viewImage({ path }: ViewImageArgs): ViewImageResult {
  const data = readFileSync(path);
  const b64 = data.toString('base64');
  const ext = extname(path).toLowerCase().slice(1);
  const mime = ext ? `image/${ext}` : 'application/octet-stream';
  return { dataUrl: `data:${mime};base64,${b64}`, bytes: data.byteLength };
}

