/**
 * @file nodeEvaluators.ts
 * @description Domain node evaluation logic for KRNLTS and KLOKS assets (§12).
 */

export function evaluateNode(
  nodeType: string,
  inputs: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> {
  switch (nodeType) {
    case 'ServiceInput':
      return { ...inputs };

    case 'AudioHarmonicSynthesizer': {
      const freq = Number(inputs.frequency ?? 440);
      const harmonics = Number(inputs.harmonicCount ?? 8);
      const gain = Number(inputs.gain ?? 0.8);
      const points = [];
      for (let i = 0; i < 32; i++) {
        let val = 0;
        for (let h = 1; h <= harmonics; h++) {
          val += Math.sin((i / 32) * Math.PI * 2 * h) * (1 / h);
        }
        points.push(Number((val * gain).toFixed(3)));
      }
      return {
        waveformBuffer: { sampleCount: 32, baseFreq: freq, points },
        peakAmplitude: Number((gain * 1.05).toFixed(2)),
      };
    }

    case 'BiquadFrequencyFilter': {
      const signal = (inputs.signalIn as any) || { points: [0.5, 0.2, -0.4, 0.8] };
      const cutoff = Number(inputs.cutoffFreq ?? 1200);
      const q = Number(inputs.resonanceQ ?? 1.5);
      const attenuation = Math.min(1.0, cutoff / 20000);
      const filteredPoints = (signal.points || [0.5]).map((v: number) => Number((v * attenuation * (q * 0.8)).toFixed(3)));
      return { signalOut: { ...signal, filteredPoints, cutoffApplied: cutoff } };
    }

    case 'PayloadSchemaValidator': {
      const payload = inputs.payload ?? {};
      const isValid = typeof payload === 'object' && payload !== null;
      return { isValid, sanitizedData: isValid ? { ...payload, sanitizedAt: Date.now() } : {} };
    }

    case 'AuthCredentialVerifier': {
      const token = String(inputs.authToken || '');
      const isAuth = token.length > 5;
      return {
        isAuthorized: isAuth,
        userId: isAuth ? 'usr_krnl_' + Math.abs(token.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 9999) : 'anonymous',
      };
    }

    case 'ArrayMapAggregate': {
      const items = Array.isArray(inputs.inputList) ? inputs.inputList : [10, 20, 30, 40];
      const factor = Number(inputs.scaleFactor ?? 1.5);
      const transformed = items.map((x: any) => Number((Number(x) * factor).toFixed(2)));
      const totalSum = transformed.reduce((acc, curr) => acc + curr, 0);
      return { resultList: transformed, totalSum: Number(totalSum.toFixed(2)) };
    }

    case 'PersistentStateStore': {
      const key = String(inputs.stateKey || 'default_key');
      const val = inputs.stateValue ?? { sample: 'data' };
      return { savedRecord: { key, val, updatedAt: new Date().toISOString() }, stateVersion: 1 };
    }

    case 'ServiceOutput':
      return { ...inputs };

    default:
      return { ...inputs, echoedConfig: config };
  }
}
