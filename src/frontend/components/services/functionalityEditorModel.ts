export interface FunctionalityHelper {
  id: string;
  name: string;
  signature: string;
  implementation: string;
}

export interface FunctionalityEvent {
  id: string;
  name: string;
  signature: string;
  implementation: string;
}

export interface FunctionalityAsset {
  id: string;
  name: string;
  description: string;
  inputSignature: string;
  outputSignature: string;
  tags: string[];
  mainFunction: string;
  stateData: string;
  helpers: FunctionalityHelper[];
  events: FunctionalityEvent[];
  libraries: string[];
}

export interface FunctionalityContext {
  declaration: string;
  helperNames: string[];
  eventNames: string[];
  libraryNames: string[];
}

const DEFAULT_MAIN = `export async function main(input: unknown, state: StateData) {
  return input;
}`;

export function createFunctionalityAsset(input: {
  id: string;
  name: string;
  description?: string;
  inputSignature?: string;
  outputSignature?: string;
  tags?: string[];
  libraries?: string[];
}): FunctionalityAsset {
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? '',
    inputSignature: input.inputSignature ?? 'unknown',
    outputSignature: input.outputSignature ?? 'unknown',
    tags: input.tags ?? [],
    mainFunction: DEFAULT_MAIN,
    stateData: 'export interface StateData {}',
    helpers: [],
    events: [],
    libraries: input.libraries?.length ? [...input.libraries] : ['@ultrst-armada/gutts'],
  };
}

export function normalizeFunctionalityAsset(
  raw: Partial<FunctionalityAsset> | undefined,
  fallback: Omit<FunctionalityAsset, 'mainFunction' | 'stateData' | 'helpers' | 'events' | 'libraries'>,
): FunctionalityAsset {
  return {
    ...fallback,
    mainFunction: raw?.mainFunction?.trim() || DEFAULT_MAIN,
    stateData: raw?.stateData?.trim() || 'export interface StateData {}',
    helpers: Array.isArray(raw?.helpers) ? raw.helpers : [],
    events: Array.isArray(raw?.events) ? raw.events : [],
    libraries: Array.isArray(raw?.libraries) && raw.libraries.length ? raw.libraries : ['@ultrst-armada/gutts'],
  };
}

export function buildFunctionalityContext(asset: FunctionalityAsset): FunctionalityContext {
  const helperNames = asset.helpers.map(helper => helper.name).filter(Boolean);
  const eventNames = asset.events.map(event => event.name).filter(Boolean);
  const libraryNames = asset.libraries.filter(Boolean);
  const helperDeclarations = asset.helpers.map(helper => helper.signature.trim()).filter(Boolean).join('\n');
  const eventDeclarations = asset.events.map(event => event.signature.trim()).filter(Boolean).join('\n');

  const declaration = [
    '// KULT GENERATED FUNCTIONALITY CONTEXT — read-only',
    ...libraryNames.map(library => `// library: ${library}`),
    asset.stateData.trim(),
    helperDeclarations,
    eventDeclarations,
    `// main function: (${asset.inputSignature}) => ${asset.outputSignature}`,
  ].filter(Boolean).join('\n\n');

  return { declaration, helperNames, eventNames, libraryNames };
}

export function upsertHelper(asset: FunctionalityAsset, helper: FunctionalityHelper): FunctionalityAsset {
  const helpers = asset.helpers.some(item => item.id === helper.id)
    ? asset.helpers.map(item => item.id === helper.id ? helper : item)
    : [...asset.helpers, helper];
  return { ...asset, helpers };
}

export function removeHelper(asset: FunctionalityAsset, id: string): FunctionalityAsset {
  return { ...asset, helpers: asset.helpers.filter(helper => helper.id !== id) };
}

export function upsertEvent(asset: FunctionalityAsset, event: FunctionalityEvent): FunctionalityAsset {
  const events = asset.events.some(item => item.id === event.id)
    ? asset.events.map(item => item.id === event.id ? event : item)
    : [...asset.events, event];
  return { ...asset, events };
}

export function removeEvent(asset: FunctionalityAsset, id: string): FunctionalityAsset {
  return { ...asset, events: asset.events.filter(event => event.id !== id) };
}

export function setFunctionalityLibrary(asset: FunctionalityAsset, library: string): FunctionalityAsset {
  if (!library.trim() || asset.libraries.includes(library.trim())) return asset;
  return { ...asset, libraries: [...asset.libraries, library.trim()] };
}

export function removeFunctionalityLibrary(asset: FunctionalityAsset, library: string): FunctionalityAsset {
  if (library === '@ultrst-armada/gutts') return asset;
  return { ...asset, libraries: asset.libraries.filter(item => item !== library) };
}
