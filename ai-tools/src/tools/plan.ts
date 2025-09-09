import { type JsonSchema, type OpenAiTool, objectSchema } from '../types';

export type StepStatus = 'pending' | 'in_progress' | 'completed';

export type PlanItemArg = {
  step: string;
  status: StepStatus;
};

export type UpdatePlanArgs = {
  explanation?: string;
  plan: PlanItemArg[];
};

export function createPlanTool(): OpenAiTool {
  const planItemProps: Record<string, JsonSchema> = {
    step: { type: 'string' },
    status: { type: 'string', description: 'One of: pending, in_progress, completed' },
  };

  const properties: Record<string, JsonSchema> = {
    explanation: { type: 'string' },
    plan: { type: 'array', items: objectSchema(planItemProps, ['step', 'status']), description: 'The list of steps' },
  };

  return {
    type: 'function',
    name: 'update_plan',
    description:
      'Updates the task plan.\nProvide an optional explanation and a list of plan items, each with a step and status.\nAt most one step can be in_progress at a time.\n',
    strict: false,
    parameters: objectSchema(properties, ['plan']),
  };
}

export type PlanUpdateResult = { message: string; ok: boolean };

export function updatePlan(args: UpdatePlanArgs): PlanUpdateResult {
  const { plan } = args;
  if (!Array.isArray(plan) || plan.length === 0) {
    throw new Error('update_plan: plan must include at least one item');
  }
  const inProgress = plan.filter((p) => p.status === 'in_progress');
  if (inProgress.length > 1) {
    throw new Error('update_plan: at most one step can be in_progress');
  }
  const valid: StepStatus[] = ['pending', 'in_progress', 'completed'];
  for (const p of plan) {
    if (!p.step || typeof p.step !== 'string') throw new Error('update_plan: step must be a non-empty string');
    if (!valid.includes(p.status)) throw new Error(`update_plan: invalid status ${p.status}`);
  }
  return { message: 'Plan updated', ok: true };
}

