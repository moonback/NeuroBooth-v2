/** Patterns haptiques synchronisés au design system mobile. */

type VibratePattern = number | number[];

function vibrate(pattern: VibratePattern): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const haptics = {
  /** Tap léger — geste secret, boutons secondaires */
  tap: () => vibrate(15),

  /** Tick countdown (3, 2, 1) */
  countdownTick: () => vibrate(25),

  /** GO! — début capture */
  countdownGo: () => vibrate([40, 20, 60]),

  /** Fin d'enregistrement */
  captureEnd: () => vibrate([30, 40, 30]),

  /** Partage réussi */
  shareSuccess: () => vibrate([20, 30, 20]),

  /** Succès geste admin (5 taps) */
  adminUnlock: () => vibrate([50, 30, 50]),

  /** Erreur PIN / action refusée */
  error: () => vibrate([80, 40, 80]),
};
