import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);

export const scenarioSchema = z.object({
  id: nonEmpty,
  locale: z.literal('ru'),
  version: nonEmpty,
  profile: nonEmpty,
  scope: nonEmpty,
  assumptions: z.array(nonEmpty).min(1),
  boundaries: z.array(nonEmpty).min(1),
  sources: z.array(z.object({ id: nonEmpty, title: nonEmpty, url: z.url() })).min(1),
  steps: z.array(z.object({
    id: nonEmpty,
    order: z.number().int().min(1),
    title: nonEmpty,
    userObservation: nonEmpty,
    explanation: z.object({ basic: nonEmpty, deeper: nonEmpty, expert: nonEmpty }),
    visualCue: z.object({
      node: z.enum(['keyboard', 'usb', 'os', 'focus', 'browser', 'cpu', 'render', 'display']),
      signalType: z.enum(['input', 'event', 'state', 'frame']),
      cameraAnchor: z.number().int().min(0).max(5),
      optionalBranch: z.boolean()
    }),
    omissions: z.array(nonEmpty).min(1),
    prohibitedClaims: z.array(nonEmpty).min(1),
    sourceRefs: z.array(nonEmpty).min(1),
    glossaryRefs: z.array(nonEmpty),
    accessibilityNarration: nonEmpty
  })).length(8),
  assessment: z.array(z.object({
    id: nonEmpty,
    prompt: nonEmpty,
    options: z.array(z.object({ id: nonEmpty, label: nonEmpty })).min(2),
    correctOptionId: nonEmpty,
    explanation: nonEmpty
  })).length(4)
}).superRefine((scenario, context) => {
  const sourceIds = new Set(scenario.sources.map((source) => source.id));
  scenario.steps.forEach((step, index) => {
    if (step.order !== index + 1) {
      context.addIssue({ code: 'custom', path: ['steps', index, 'order'], message: 'Steps must be sequential' });
    }
    for (const sourceRef of step.sourceRefs) {
      if (!sourceIds.has(sourceRef)) {
        context.addIssue({ code: 'custom', path: ['steps', index, 'sourceRefs'], message: `Unknown source ${sourceRef}` });
      }
    }
  });
  for (const [index, question] of scenario.assessment.entries()) {
    if (!question.options.some((option) => option.id === question.correctOptionId)) {
      context.addIssue({ code: 'custom', path: ['assessment', index], message: 'Correct option missing' });
    }
  }
});

export type Scenario = z.infer<typeof scenarioSchema>;
