import type { UIAuthoringOperation } from '@ultrst-armada/kloks/contracts';
import type { FunctionalityAsset } from './functionalityEditorModel';

export function buildServiceAuthoringOperations(functionalities: FunctionalityAsset[]): UIAuthoringOperation[] {
  return functionalities.map((fn) => ({
    operationId: fn.id,
    name: fn.name,
    description: fn.description,
    inputFields: [{ name: 'input', type: fn.inputSignature }],
    outputFields: [{ name: 'output', type: fn.outputSignature }],
  }));
}
