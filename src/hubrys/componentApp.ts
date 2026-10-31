import { DepmBackend } from '../backend/DepmBackend.js';

type CapabilitySource = Record<string, unknown>;
const source = DepmBackend as unknown as {services?:CapabilitySource;orchestrations?:CapabilitySource};

function resolve(name:string): {owner:unknown;operation:string} {
  const parts=name.split('.');
  const serviceName=parts.shift() ?? '';
  const operation=parts.join('.');
  const owner=source.services?.[serviceName] ?? source.orchestrations?.[serviceName];
  if(!owner) throw new Error('[Hubrys] Capability service not found: '+serviceName);
  return {owner,operation};
}

export const hubrysComponentApp = {
  manifest: {id:'kult',name:'Kult',version:'0.0.0'},
  backend: {
    listServices: () => Object.keys(source.services ?? {}),
    hasCapability: (name:string) => { try { resolve(name); return true; } catch { return false; } },
    getOrchestration: <T=unknown>(name:string) => source.orchestrations?.[name] as T,
    async executeCapability<TIn=unknown,TOut=unknown>(capabilityName:string,_operation?:string,input?:TIn):Promise<TOut> {
      const {owner,operation}=resolve(capabilityName);
      const fn=(owner as Record<string,unknown>)[operation];
      if(typeof fn!=='function') throw new Error('[Hubrys] Capability operation not found: '+capabilityName);
      return await (fn as (value?:TIn)=>Promise<TOut>)(input);
    },
  },
};
export default hubrysComponentApp;
