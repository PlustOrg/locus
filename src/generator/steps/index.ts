import { GeneratorStep } from '../pipeline';
import { reactRuntimeStep } from './step.reactRuntime';
import { legacyOptionalWarningStep } from './step.legacyOptionalWarning';
import { workflowsManifestStep } from './step.workflowsManifest';
import { prismaStep } from './step.prisma';
import { expressStep } from './step.express';
import { reactComponentsStep, reactPagesStep } from './step.reactComponents';
import { themeStep } from './step.theme';
import { nextStep } from './step.next';
import { warningsSummaryStep } from './step.warnings';
import { manifestStep } from './step.manifest';

export function integrateExternalSteps(_inline: GeneratorStep[]): GeneratorStep[] {
  // Full replacement with extracted ordered list matching original semantics
  return [
    legacyOptionalWarningStep,
    reactRuntimeStep,
    workflowsManifestStep,
    prismaStep,
    expressStep,
    reactComponentsStep,
    reactPagesStep,
    themeStep,
    nextStep,
    warningsSummaryStep,
    manifestStep,
  ];
}

export {
  reactRuntimeStep,
  legacyOptionalWarningStep,
  workflowsManifestStep,
  prismaStep,
  expressStep,
  reactComponentsStep,
  reactPagesStep,
  themeStep,
  nextStep,
  warningsSummaryStep,
  manifestStep
};
