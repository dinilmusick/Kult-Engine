// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL HOVER & 'D' KEY INSPECTION HOOK (Laws L9, L18, L19)
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useInspectionStore } from '../../frontend-state/inspectionStore';

export function useGlobalHoverInspection() {
  const { setHover, clearHover, setDKeyPressed } = useInspectionStore();

  useEffect(() => {
    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;

      const element = target.closest<HTMLElement>(
        '[data-skipo-label], [data-tooltip], [aria-label], [title], button, a, input, select'
      );

      if (!element) return;

      const explicitLabel = element.getAttribute('data-skipo-label');
      const explicitDesc = element.getAttribute('data-skipo-desc');
      const tooltip = element.getAttribute('data-tooltip');
      const aria = element.getAttribute('aria-label');
      const title = element.getAttribute('title');
      const text = element.innerText?.trim();

      const rawLabel = explicitLabel || tooltip || aria || title || text || '';
      // Law L18: Cap label to 4 words maximum
      const words = rawLabel.split(/\s+/).filter(Boolean);
      const label = words.slice(0, 4).join(' ');
      const desc = explicitDesc || (words.length > 4 ? rawLabel : '');

      if (label) {
        setHover(label, desc);
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        clearHover();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' && !e.repeat) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        setDKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD') {
        setDKeyPressed(false);
      }
    };

    window.addEventListener('pointerover', handlePointerOver);
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setHover, clearHover, setDKeyPressed]);
}
