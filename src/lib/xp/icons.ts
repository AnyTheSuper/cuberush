import type { Discipline } from '../../types';

export function disciplineIcon(d: Discipline): string {
  switch (d) {
    case 'standard':
      return '⏱';
    case 'blind':
      return '🕶';
    case 'oneHanded':
      return '✋';
    case 'feet':
      return '🦶';
    case 'multi':
      return '🧩';
    case 'other':
      return '★';
    default:
      return '⏱';
  }
}

