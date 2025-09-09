import { type OpenAiTool, type SandboxPolicy } from './types';
import { createShellTool, createShellToolForSandbox } from './tools/shell';
import { createPlanTool } from './tools/plan';
import { createApplyPatchFreeformTool, createApplyPatchJsonTool } from './tools/apply_patch';
import { createExecCommandToolForResponsesApi, createWriteStdinToolForResponsesApi } from './tools/exec_command';
import { createViewImageTool } from './tools/view_image';
import { createWebSearchToolPreview } from './tools/web_search';

export type ApplyPatchToolType = 'freeform' | 'function';

export type ToolsBuildConfig = {
  sandboxPolicy?: SandboxPolicy; // if omitted, default shell without escalation fields
  includePlanTool?: boolean;
  applyPatchTool?: ApplyPatchToolType; // if omitted, not included
  includeWebSearch?: boolean;
  useStreamableShell?: boolean;
  includeViewImageTool?: boolean;
};

export function buildOpenAiTools(cfg: ToolsBuildConfig = {}): OpenAiTool[] {
  const tools: OpenAiTool[] = [];

  if (cfg.useStreamableShell) {
    tools.push(createExecCommandToolForResponsesApi());
    tools.push(createWriteStdinToolForResponsesApi());
  } else if (cfg.sandboxPolicy) {
    tools.push(createShellToolForSandbox(cfg.sandboxPolicy));
  } else {
    tools.push(createShellTool());
  }

  if (cfg.includePlanTool) tools.push(createPlanTool());

  if (cfg.applyPatchTool === 'freeform') tools.push(createApplyPatchFreeformTool());
  if (cfg.applyPatchTool === 'function') tools.push(createApplyPatchJsonTool());

  if (cfg.includeWebSearch) tools.push(createWebSearchToolPreview());
  if (cfg.includeViewImageTool) tools.push(createViewImageTool());

  return tools;
}

