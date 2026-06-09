# NeuroBooth 360 — Roadmap Produit

> **Édition Mobile-Only** · Dernière mise à jour : 9 juin 2026  
> Application PWA de photobooth 360° pilotée depuis un smartphone, sans poste fixe.

---

## Résumé exécutif

**NeuroBooth 360** transforme un smartphone en station de capture 360° autonome : enregistrement vidéo, rotation motorisée (ESP32), traitement post-capture (ralenti), partage instantané (QR code / cloud Supabase) et administration verrouillée (mode kiosque).

**Positionnement** : solution événementielle nomade — mariages, salons, activations de marque — où l'opérateur tient le bras 360 ou le téléphone est fixé sur le plateau tournant.

**Contrainte produit** : **mobile-only**. L'interface, les interactions et les APIs ciblent exclusivement iOS Safari et Chrome Android. Le desktop n'est pas supporté volontairement.

| Indicateur | Valeur actuelle |
|---|---|
| Version | 1.0.0 |
| Stack | React 18 · TypeScript · Vite · Tailwind · Supabase · PWA |
| Fonctionnalités livrées | 14 |
| Fonctionnalités planifiées | 20 |
| Thèmes visuels | 4 (Dark, Neon, Elegant, Party) |

---

## Audit de l'existant (v1.0.0)

Analyse du code source au 9 juin 2026. État réel, pas marketing.

### Livré et opérationnel

| Domaine | Fonctionnalité | Fichiers clés |
|---|---|---|
| **Capture** | Enregistrement vidéo WebM/VP9 avec preview live | `CaptureScreen.tsx`, `useCamera` via `AppContext` |
| **Capture** | Compte à rebours animé configurable | `CountdownScreen.tsx` |
| **Capture** | Qualité vidéo 480p → 4K, caméra avant/arrière | `types/index.ts` → `QUALITY_CONSTRAINTS` |
| **Post-prod** | Ralenti logiciel (début, durée, facteur) | `videoProcessor.ts` |
| **Hardware** | Contrôle moteur ESP32 (WebSerial + BLE) synchronisé à l'enregistrement | `useMotor.ts`, `MotorPanel.tsx` |
| **Cloud** | Sync Supabase (captures + settings), upload avec progression | `storage.ts`, `useSupabaseSync.ts` |
| **Offline** | IndexedDB local, reprise upload à la reconnexion | `storage.ts` |
| **Partage** | QR code vers URL cloud Supabase | `PreviewScreen.tsx` |
| **Admin** | Panneau PIN (mode kiosque), galerie, stats, export ZIP | `AdminPanel.tsx`, `GalleryPanel.tsx` |
| **UX** | 4 thèmes CSS variables, PWA installable plein écran | `index.css`, `vite.config.ts` |
| **UX** | Accès admin discret (5 taps + haptique) | `WelcomeScreen.tsx` |
| **Branding** | Nom d'événement, logo, watermark texte (overlay live) | `SettingsPanel.tsx` |

### Partiellement implémenté

| Élément | État | Gap |
|---|---|---|
| **Watermark** | Texte affiché en overlay pendant la capture | Non incrusté dans la vidéo finale exportée |
| **Logo événement** | Configurable en admin | Non burn-in sur la vidéo |
| **LED bandeau** | Firmware ESP32 présent (`Esp32-led.cpp`) | Aucun contrôle depuis l'app React |
| **Mobile-first** | Viewport verrouillé, `100dvh`, tap highlight off | Pas de verrouillage portrait ni détection desktop |

### Non implémenté (confirmé par le code)

- Partage natif OS (Web Share API)
- Mode Boomerang
- Caméra ultra grand-angle (0.5x)
- Stabilisation gyroscopique
- Encodage HEVC matériel
- Filtres IA / beauté
- Audio/musique de fond
- Verrouillage OS (Guided Access / Screen Pinning)

---

## Design System — Mobile-Only

### Principes directeurs

L'interface doit fonctionner **à une main**, en **portrait**, sur un écran de 5" à 6.7", en plein soleil et en faible luminosité.

```
┌─────────────────────────┐
│  Zone sûre (notch/Dynamic Island)  │  ← padding-top: env(safe-area-inset-top)
├─────────────────────────┤
│                         │
│     Zone de contenu     │  ← preview caméra, compte à rebours
│     (lecture passive)   │
│                         │
├─────────────────────────┤
│  Zone d'action (pouce)  │  ← CTA 56px min, bottom: safe-area + 24px
└─────────────────────────┘
```

### Tokens actuels (à conserver)

| Token | Rôle | Valeur par thème |
|---|---|---|
| `--accent` | CTA, focus, progress | Bleu / Vert / Or / Rose |
| `--accent-glow` | Halo boutons, countdown | `rgba(accent, 0.3)` |
| `--bg` | Fond plein écran | `#050505` – `#0a0a0a` |
| `--bg-card` | Cartes admin | `#111` – `#161410` |
| `--ring-color` | Anneaux animés welcome | Accent à 6–8% opacité |

### Optimisations design planifiées

| # | Optimisation | Impact | Phase |
|---|---|---|---|
| D1 | **Verrouillage portrait** (`orientation: portrait` PWA + CSS `@media orientation`) | Expérience kiosque cohérente | Phase 2 |
| D2 | **Safe areas iOS** (`padding: env(safe-area-inset-*)`) sur tous les écrans | Évite le notch et la barre home | Phase 2 |
| D3 | **Touch targets 48×48px min** (WCAG 2.5.5) sur tous les boutons admin | Réduit les erreurs de tap | Phase 2 |
| D4 | **Mode haute luminosité** : contraste renforcé, ombres texte sur preview | Lisibilité en extérieur | Phase 2 |
| D5 | **Thème « Brand »** : couleurs accent + logo injectés depuis les settings admin | White-label événementiel | Phase 3 |
| D6 | **Typographie display** : police titres distincte d'Inter (ex. Clash Display, Satoshi) | Identité premium | Phase 3 |
| D7 | **Micro-animations haptiques** synchronisées (countdown, fin capture, partage) | Feedback tactile pro | Phase 2 |
| D8 | **Écran veille attractif** : preview floutée + logo événement animé entre sessions | Réduit la dérive hors-app | Phase 3 |

### Matrice thèmes × contexte événementiel

| Thème | Contexte idéal | Accent | Ambiance |
|---|---|---|---|
| **Dark** | Corporate, tech, B2B | `#3b82f6` Bleu | Sobre, professionnel |
| **Neon** | Club, gaming, esport | `#00ff87` Vert néon | Futuriste, énergique |
| **Elegant** | Mariage, gala, luxe | `#d4a054` Or | Raffiné, haut de gamme |
| **Party** | Anniversaire, festival | `#f43f5e` Rose | Fun, festif |

---

## Architecture cible Mobile-Only

```
┌──────────────────────────────────────────────────┐
│                   PWA (Vite)                      │
│  Welcome → Countdown → Capture → Preview → Admin │
├────────────┬─────────────┬───────────────────────┤
│  Media API │  WebCodecs  │  Web Share / BLE      │
│  getUserMedia│  (HEVC)   │  Navigator APIs       │
├────────────┴─────────────┴───────────────────────┤
│         IndexedDB (offline)  ↔  Supabase Cloud    │
├──────────────────────────────────────────────────┤
│              ESP32 (Moteur + LED via BLE)         │
└──────────────────────────────────────────────────┘
```

**Navigateurs cibles** : Safari iOS 17+, Chrome Android 120+.  
**Hors scope** : Firefox desktop, Edge, tablettes en mode desktop.

---

## 20 Fonctionnalités — Roadmap détaillée

Fonctionnalités sélectionnées pour un photobooth 360 mobile : capture, viralité, fiabilité terrain, monétisation événementielle.

---

### Phase 2 — Capture & Partage (Q3 2026)
*Objectif : maximiser la qualité perçue et le taux de partage invité.*

| # | Fonctionnalité | Description | Priorité | Effort |
|---|---|---|:---:|:---:|
<!-- | **1** | **Watermark & logo burn-in** | Incruster texte + logo événement dans la vidéo finale via Canvas/WebCodecs (aujourd'hui : overlay live uniquement) | 🔥 | M | -->
| **2** | **Partage natif Web Share API** | Bouton unique ouvrant le menu OS : AirDrop, WhatsApp, SMS, Instagram Stories | 🔥 | S |
| **3** | **Mode Boomerang** | Lecture avant/arrière de la séquence 360, export optimisé 3–5 s | 🔥 | M |
| **4** | **Recadrage social 9:16** | Export vertical auto-cadré pour Reels, TikTok, Stories (crop intelligent centré) | 🔥 | M |
| **5** | **Caméra ultra grand-angle (0.5x)** | Sélection de l'objectif wide natif via `advanced: [{ zoom: 0.5 }]` ou `facingMode` multi-lens | 🔥 | M |
<!-- | **6** | **Verrouillage AF/AE** | Bloquer focus et exposition avant rotation pour éviter pompage lumineux | ⭐ | S | -->
| **7** | **Musique de fond** | Bibliothèque de pistes libres de droits, mixage audio à l'export | ⭐ | L |

---

### Phase 3 — Fiabilité terrain (Q4 2026)
*Objectif : tenir un événement de 8 h sans crash ni surchauffe.*

| # | Fonctionnalité | Description | Priorité | Effort |
|---|---|---|:---:|:---:|
| **8** | **Encodage HEVC matériel (H.265)** | Export via WebCodecs + accélération GPU : −50% poids, +2× vitesse | 🔥 | L |
| **9** | **Mode économie d'énergie** | Preview 15 fps entre sessions, luminosité réduite, veille auto après 60 s | ⭐ | S |
| **10** | **Alerte thermique** | Détection surcharge (fps drop, `navigator.deviceMemory`) + pause forcée avec message | ⭐ | M |
| **11** | **Nettoyage stockage intelligent** | Suppression auto des captures locales > 7 jours si espace < 2 Go | 🔥 | S |
| **12** | **Sync moteur ↔ gyroscope** | Déclenchement auto de l'enregistrement quand l'accéléromètre détecte le début de rotation | ⭐ | M |
| **13** | **Contrôle LED RGB (BLE)** | Interface admin pour couleur, intensité et séquences du bandeau FastLED (firmware existant) | ⭐ | M |

---

### Phase 4 — Expérience pro & monétisation (Q1 2027)
*Objectif : différenciation agences événementielles et rétention invités.*

| # | Fonctionnalité | Description | Priorité | Effort |
|---|---|---|:---:|:---:|
| **14** | **Stabilisation gyroscopique (EIS)** | Correction logicielle des vibrations du bras via `DeviceOrientationEvent` + transform Canvas | 🔥 | L |
| **15** | **Filtre beauté temps réel** | Lissage peau + correction exposition visage (MediaPipe Face Mesh ou API native) | ⭐ | L |
| **16** | **Déclenchement gestuel / vocal** | Lancer le countdown par lever de main ou mot-clé « Cheese » / « Go » | ⭐ | M |
| **17** | **File d'attente invités** | Saisie prénom avant capture, vidéo nommée, galerie filtrable par guest | 🔥 | M |
| **18** | **Thème Brand personnalisé** | Couleurs accent, police et fond uploadés depuis l'admin → génération CSS dynamique | ⭐ | M |
| **19** | **Landing page invité brandée** | Page web légère (lien QR) : logo, nom invité, bouton téléchargement, CTA réseaux sociaux | 🔥 | M |
| **20** | **Mode kiosque OS** | Guide Screen Pinning (Android) + instructions Guided Access (iOS) intégrées dans l'admin | ⭐ | S |

> **Effort** : S = 1–3 j · M = 1–2 sem. · L = 3+ sem.

---

## Priorisation visuelle

```
Impact invité / viralité
        ▲
        │  [2] Share    [4] 9:16     [3] Boomerang
        │  [1] Watermark  [19] Landing
        │
        │  [5] Wide     [17] Queue    [14] EIS
        │  [7] Musique  [18] Brand
        │
        │  [8] HEVC     [11] Storage  [9] Battery
        │  [10] Thermal [13] LED
        │
        │  [6] AF/AE    [12] Gyro     [16] Vocal
        │  [20] Kiosk OS [15] Beauté
        └──────────────────────────────────► Complexité technique
```

---

## Jalons & livrables

| Jalon | Date cible | Livrables clés | Critère de succès |
|---|---|---|---|
| **v1.1** | Août 2026 | #1 Watermark burn-in, #2 Share natif, D2 Safe areas | Taux de partage > 40% |
| **v1.2** | Oct. 2026 | #3 Boomerang, #4 Export 9:16, #5 Ultra-wide | 3 formats d'export disponibles |
| **v1.3** | Déc. 2026 | #8 HEVC, #9 Battery, #10 Thermal, #11 Storage | 8 h d'événement sans crash |
| **v2.0** | Mars 2027 | #14 EIS, #17 Queue, #19 Landing, #18 Brand | Package agence complet |

---

## Métriques produit (KPIs)

| Métrique | Cible v2.0 | Mesure actuelle |
|---|---|---|
| Temps session complète (tap → QR) | < 25 s | ~35 s (estimé) |
| Taux de partage invité | > 50% | Non instrumenté |
| Uptime sur événement 8 h | > 99% | Non instrumenté |
| Poids vidéo moyen (10 s, 1080p) | < 8 Mo (HEVC) | ~15 Mo (WebM) |
| Captures / heure (pic) | > 30 | Via `StatsPanel` (basique) |

---

## Dépendances techniques

| Fonctionnalité | API / Librairie | Support mobile |
|---|---|---|
| #2 Share natif | `navigator.share()` + `navigator.canShare()` | iOS 15+, Android Chrome |
| #5 Ultra-wide | `MediaTrackConstraints.advanced` | iOS 13+, Android variable |
| #8 HEVC | WebCodecs `VideoEncoder` codec `hev1` | iOS 17+, Android 12+ partiel |
| #14 EIS | `DeviceOrientationEvent` + Canvas 2D | iOS 13+, Android Chrome |
| #15 Beauté | MediaPipe Face Mesh / WebGPU | Expérimental mobile |
| #13 LED BLE | Web Bluetooth GATT (service existant ESP32) | Android natif, iOS 17+ BLE limité |
| #20 Kiosque OS | Screen Pinning API / Guided Access manuel | Android oui, iOS manuel |

---

## Risques identifiés

| Risque | Probabilité | Mitigation |
|---|---|---|
| WebCodecs HEVC non supporté sur anciens Android | Haute | Fallback WebM VP9 automatique |
| Surchauffe iPhone en 4K prolongé | Haute | #10 Thermal + limite qualité auto |
| Web Bluetooth instable iOS | Moyenne | Prioriser WebSerial sur Android kiosque |
| Traitement Canvas ralenti = CPU intensif | Moyenne | #8 HEVC + réduction résolution preview |
| Stockage IndexedDB saturé | Moyenne | #11 Auto-nettoyage + alerte admin |

---

## Stack évolutive (backlog technique)

- [ ] Verrouillage orientation portrait dans `manifest.webmanifest`
- [ ] `prefers-reduced-motion` pour accessibilité
- [ ] Tests E2E Playwright mobile (iPhone 14 viewport)
- [ ] Sentry ou équivalent pour crash reporting terrain
- [ ] Analytics privacy-friendly (Plausible / Umami) pour KPIs
- [ ] Compression thumbnail WebP pour galerie admin
- [ ] Service Worker stratégie `CacheFirst` pour assets statiques

---

## Références projet

| Ressource | Chemin |
|---|---|
| Schéma Supabase | `supabase/migrations/` |
| Firmware moteur | `Esp32-bandeaux.cpp` |
| Firmware LED | `Esp32-led.cpp` |
| Câblage hardware | `Cablage-esp32.md` |
| Config PWA | `vite.config.ts` |
| Tokens thème | `src/index.css` |

---

*NeuroBooth 360 — Mobile-Only Photobooth Platform*  
*Document maintenu par l'équipe produit. Prochaine revue : septembre 2026.*
