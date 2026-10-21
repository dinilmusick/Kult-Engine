export interface EditorFunctionality {
  id: string; name: string; description: string; inputSignature: string; outputSignature: string; tags: string[];
}
export interface EditorOrchestration {
  id: string; name: string; description: string; functionalityIds: string[];
}
export interface EditorValidation {
  errors: string[];
  isValid: boolean;
}

export function validateServiceEditor(input: {
  name: string;
  version: string;
  folder: string;
  libraries: string[];
  functionalities: EditorFunctionality[];
  orchestrations: EditorOrchestration[];
}): EditorValidation {
  const errors: string[] = [];
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(input.name.trim())) errors.push("Service name must start with a letter and contain only letters, numbers, _ or -.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(input.version.trim())) errors.push("Version must be semantic version syntax such as 0.1.0.");
  if (!input.folder.trim()) errors.push("Service folder is required.");
  if (!input.libraries.includes("@ultrst-armada/gutts")) errors.push("@ultrst-armada/gutts is required.");
  const functionNames = new Set<string>();
  for (const fn of input.functionalities) {
    if (!fn.name.trim()) errors.push("Functionality name is required.");
    if (functionNames.has(fn.name.trim())) errors.push(`Duplicate functionality name: ${fn.name.trim()}.`);
    functionNames.add(fn.name.trim());
    if (!fn.inputSignature.trim() || !fn.outputSignature.trim()) errors.push(`Functionality ${fn.name || fn.id} requires input and output signatures.`);
  }
  const ids = new Set(input.functionalities.map((fn) => fn.id));
  const orchestrationNames = new Set<string>();
  for (const orchestration of input.orchestrations) {
    if (orchestrationNames.has(orchestration.name.trim())) errors.push(`Duplicate orchestration name: ${orchestration.name.trim()}.`);
    orchestrationNames.add(orchestration.name.trim());
    if (orchestration.functionalityIds.length < 2) errors.push(`Orchestration ${orchestration.name || orchestration.id} must reference at least two functionalities.`);
    if (orchestration.functionalityIds.some((id) => !ids.has(id))) errors.push(`Orchestration ${orchestration.name || orchestration.id} references an unknown functionality.`);
  }
  if (new Set(input.libraries).size !== input.libraries.length) errors.push("Duplicate libraries are not allowed.");
  return { errors, isValid: errors.length === 0 };
}
