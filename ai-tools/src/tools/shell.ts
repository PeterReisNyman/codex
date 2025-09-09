import { type JsonSchema, type OpenAiTool, type SandboxPolicy, objectSchema } from '../types';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export type ShellArgs = {
  command: string[];
  workdir?: string;
  timeout_ms?: number;
  // Present on sandboxed variants
  with_escalated_permissions?: boolean;
  justification?: string;
};

export type ShellResult = {
  stdout: string;
  stderr: string;
  exit_code: number | null;
};

function baseShellSchema(): Record<string, JsonSchema> {
  return {
    command: { type: 'array', items: { type: 'string' }, description: 'The command to execute' },
    workdir: { type: 'string', description: 'The working directory to execute the command in' },
    timeout_ms: { type: 'number', description: 'The timeout for the command in milliseconds' },
  };
}

export function createShellTool(): OpenAiTool {
  const parameters = objectSchema(baseShellSchema(), ['command']);
  return {
    type: 'function',
    name: 'shell',
    description: 'Runs a shell command and returns its output',
    strict: false,
    parameters,
  };
}

export function createShellToolForSandbox(policy: SandboxPolicy): OpenAiTool {
  const properties = baseShellSchema();

  // Only expose escalation fields on sandboxed policies
  if (policy.kind === 'workspace-write' || policy.kind === 'read-only') {
    properties.with_escalated_permissions = {
      type: 'boolean',
      description:
        'Whether to request escalated permissions. Set to true if command needs to be run without sandbox restrictions',
    };
    properties.justification = {
      type: 'string',
      description:
        'Only set if with_escalated_permissions is true. 1-sentence explanation of why we want to run this command.',
    };
  }

  const description = (() => {
    if (policy.kind === 'danger-full-access') {
      return 'Runs a shell command and returns its output.';
    }
    const requiresNetworkLine = policy.kind === 'workspace-write' && policy.network_access === false
      ? '\n  - Commands that require network access\n'
      : '';
    if (policy.kind === 'read-only') {
      return [
        'The shell tool is used to execute shell commands.',
        '- When invoking the shell tool, your call will be running in a landlock sandbox, and some shell commands (including apply_patch) will require escalated permissions:',
        '  - Types of actions that require escalated privileges:',
        '    - Reading files outside the current directory',
        '    - Writing files',
        '    - Applying patches',
        '  - Examples of commands that require escalated privileges:',
        '    - apply_patch',
        '    - git commit',
        '    - npm install or pnpm install',
        '    - cargo build',
        '    - cargo test',
        '- When invoking a command that will require escalated privileges:',
        '  - Provide the with_escalated_permissions parameter with the boolean value true',
        '  - Include a short, 1 sentence explanation for why we need to run with_escalated_permissions in the justification parameter',
      ].join('\n');
    }
    return [
      'The shell tool is used to execute shell commands.',
      '- When invoking the shell tool, your call will be running in a landlock sandbox, and some shell commands will require escalated privileges:',
      '  - Types of actions that require escalated privileges:',
      '    - Reading files outside the current directory',
      '    - Writing files outside the current directory, and protected folders like .git or .env' + requiresNetworkLine.trimEnd(),
      '  - Examples of commands that require escalated privileges:',
      '    - git commit',
      '    - npm install or pnpm install',
      '    - cargo build',
      '    - cargo test',
      '- When invoking a command that will require escalated privileges:',
      '  - Provide the with_escalated_permissions parameter with the boolean value true',
      '  - Include a short, 1 sentence explanation for why we need to run with_escalated_permissions in the justification parameter.'
    ].join('\n');
  })();

  return {
    type: 'function',
    name: 'shell',
    description,
    strict: false,
    parameters: objectSchema(properties, ['command']),
  };
}

export async function shell({ command, workdir, timeout_ms }: ShellArgs): Promise<ShellResult> {
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error('shell: command must be a non-empty string array');
  }

  const [cmd, ...args] = command;
  const child = spawn(cmd, args, {
    cwd: workdir,
    shell: false,
  });

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (b) => (stdout += b.toString()));
  child.stderr?.on('data', (b) => (stderr += b.toString()));

  let timeout: NodeJS.Timeout | undefined;
  const exitPromise = (async () => {
    const [code] = (await once(child, 'exit')) as [number | null, NodeJS.Signals | null];
    return code;
  })();

  try {
    if (timeout_ms && timeout_ms > 0) {
      const timer = new Promise<number | null>((resolve, reject) => {
        timeout = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`shell: timeout after ${timeout_ms}ms`));
        }, timeout_ms);
      });
      const result = await Promise.race([exitPromise, timer]);
      if (timeout) clearTimeout(timeout);
      return { stdout, stderr, exit_code: result ?? null };
    } else {
      const code = await exitPromise;
      return { stdout, stderr, exit_code: code ?? null };
    }
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

