// Generic JSON Schema subset matching Rust `JsonSchema`
export type JsonSchema =
  | { type: 'boolean'; description?: string }
  | { type: 'string'; description?: string }
  | { type: 'number'; description?: string }
  | { type: 'array'; items: JsonSchema; description?: string }
  | {
      type: 'object';
      properties: Record<string, JsonSchema>;
      required?: string[];
      additionalProperties?: boolean;
    };

// OpenAI Responses API tool definitions (TS equivalents)
export type ResponsesApiFunctionTool = {
  type: 'function';
  name: string;
  description: string;
  strict: boolean;
  parameters: JsonSchema;
};

export type FreeformTool = {
  type: 'custom';
  name: string;
  description: string;
  format: {
    type: 'grammar';
    syntax: string; // e.g., 'lark'
    definition: string; // grammar text
  };
};

export type LocalShellTool = { type: 'local_shell' };
export type WebSearchTool = { type: 'web_search_preview' };

export type OpenAiTool =
  | ResponsesApiFunctionTool
  | FreeformTool
  | LocalShellTool
  | WebSearchTool;

// Sandbox policy (simplified TS mirror of Rust enum)
export type SandboxPolicy =
  | { kind: 'workspace-write'; network_access: boolean }
  | { kind: 'danger-full-access' }
  | { kind: 'read-only' };

// Common function-call outputs
export type FunctionCallOutput = {
  content: string;
  success?: boolean; // informational
};

// Utility: build object schema
export function objectSchema(
  properties: Record<string, JsonSchema>,
  required?: string[],
  additionalProperties = false,
): JsonSchema {
  return { type: 'object', properties, required, additionalProperties };
}

