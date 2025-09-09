import { objectSchema, type OpenAiTool } from '../types';

export const EXEC_COMMAND_TOOL_NAME = 'exec_command' as const;
export const WRITE_STDIN_TOOL_NAME = 'write_stdin' as const;

export type ExecCommandArgs = {
  cmd: string; // shell command line
  yield_time_ms?: number;
  max_output_tokens?: number;
  shell?: string; // defaults to /bin/bash in Rust; optional here
  login?: boolean; // defaults true in Rust; optional here
};

export type WriteStdinArgs = {
  session_id: number; // numeric id of exec session
  chars: string; // characters to write to stdin
  yield_time_ms?: number;
  max_output_tokens?: number;
};

export function createExecCommandToolForResponsesApi(): OpenAiTool {
  return {
    type: 'function',
    name: EXEC_COMMAND_TOOL_NAME,
    description: 'Execute shell commands on the local machine with streaming output.',
    strict: false,
    parameters: objectSchema(
      {
        cmd: { type: 'string', description: 'The shell command to execute.' },
        yield_time_ms: { type: 'number', description: 'The maximum time in milliseconds to wait for output.' },
        max_output_tokens: { type: 'number', description: 'The maximum number of tokens to output.' },
        shell: { type: 'string', description: 'The shell to use. Defaults to "/bin/bash".' },
        login: { type: 'boolean', description: 'Whether to run the command as a login shell. Defaults to true.' },
      },
      ['cmd'],
    ),
  };
}

export function createWriteStdinToolForResponsesApi(): OpenAiTool {
  return {
    type: 'function',
    name: WRITE_STDIN_TOOL_NAME,
    description:
      "Write characters to an exec session's stdin. Returns all stdout+stderr received within yield_time_ms.\nCan write control characters (\\u0003 for Ctrl-C), or an empty string to just poll stdout+stderr.",
    strict: false,
    parameters: objectSchema(
      {
        session_id: { type: 'number', description: 'The ID of the exec_command session.' },
        chars: { type: 'string', description: 'The characters to write to stdin.' },
        yield_time_ms: {
          type: 'number',
          description: 'The maximum time in milliseconds to wait for output after writing.',
        },
        max_output_tokens: { type: 'number', description: 'The maximum number of tokens to output.' },
      },
      ['session_id', 'chars'],
    ),
  };
}

// These are stubs here; real interactive sessions are runtime-specific.
export function execCommand(_args: ExecCommandArgs): { session_id: number; message: string } {
  return { session_id: Date.now(), message: 'exec_command started (stub)' };
}

export function writeStdin(_args: WriteStdinArgs): { message: string } {
  return { message: 'write_stdin executed (stub)' };
}

