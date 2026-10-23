import { skipoAgentService } from './skipoAgent';

export function runSkipoAgentTests() {
  const context = skipoAgentService.inspect();
  const results = [
    { name: 'Kult exposes a Skipo agent runtime', passed: context.app.runtime === 'skipo' },
    { name: 'Kult agent exposes service and UI promotion suggestions', passed: context.capabilities.includes('suggest-service-promotion') && context.capabilities.includes('suggest-ui-promotion') },
    { name: 'Kult agent routes reusable assets to the correct library', passed: skipoAgentService.promotionPlan({ kind: 'SERVICE', name: 'x' }).target === 'KLOKS' && skipoAgentService.promotionPlan({ kind: 'UI', name: 'x' }).target === 'FLOKS' },
  ];
  return { passed: results.every((x) => x.passed), results };
}
