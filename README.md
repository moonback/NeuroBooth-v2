# NeuroBooth - NeuroBooth 360°

Une application de NeuroBooth 360° moderne, fonctionnelle et élégante, avec support hors-ligne et synchronisation cloud via Supabase.

## Fonctionnalités

### 🎯 Core
- **Capture vidéo 360°** - Enregistrement vidéo avec compte à rebours
- **Multi-thèmes** - Dark, Neon, Elegant, Party (avec prévisualisation visuelle)
- **Ralenti vidéo** - Ajoutez des effets de ralenti personnalisables
- **Watermark** - Texte et logo personnalisable pour vos vidéos
- **Mode Kiosque** - Protection par PIN pour le panneau admin
- **Offline First** - Fonctionne hors-ligne avec IndexedDB, synchronise automatiquement

### 📊 Panneau Admin
- **Paramètres** - Configurer le nom de l'événement, logo, durée de capture, etc.
- **Galerie** - Voir, partager, télécharger et supprimer les captures
- **Statistiques** - Nombre de captures, partages, durée moyenne, activité par heure
- **Contrôle Plateau** - Intégration avec un plateau motorisé 360° (WebSerial / Bluetooth)
- **Sync Settings** - Les paramètres sont automatiquement synchronisés avec Supabase

### ☁️ Cloud (Supabase)
- Stockage des vidéos dans un bucket Supabase
- Base de données PostgreSQL pour les métadonnées
- Synchronisation automatique en ligne/hors-ligne
- Sauvegarde des paramètres dans la base de données
- Téléchargements progressifs avec barre de progression

## Tech Stack

- **Frontend** - React 18 + TypeScript + Vite
- **Styling** - Tailwind CSS (Mobile-first responsive design)
- **Icons** - Lucide React
- **Storage** - IndexedDB (local) + Supabase Storage (cloud)
- **Database** - Supabase PostgreSQL (captures + settings)
- **PWA** - Vite Plugin PWA (pour installation en tant qu'application)

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase (optionnel, pour le cloud)

### Étapes

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer Supabase (optionnel)**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Copier votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`
   - Créer un fichier `.env` à la racine :
     ```env
     VITE_SUPABASE_URL=votre-url-supabase
     VITE_SUPABASE_ANON_KEY=votre-cle-anonyme
     ```
   - Exécuter les migrations SQL dans l'ordre (via le SQL Editor de Supabase) :
     1. `supabase/migrations/20260608164621_photobooth_schema.sql`
     2. `supabase/migrations/20260608170000_storage_bucket.sql`
     3. `supabase/migrations/20260608180000_settings_table.sql`

3. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Build pour la production**
   ```bash
   npm run build
   ```

## Scripts disponibles

| Commande           | Description                                  |
|--------------------|----------------------------------------------|
| `npm run dev`      | Démarre le serveur de développement          |
| `npm run build`    | Compile pour la production                   |
| `npm run preview`  | Prévisualise le build production             |
| `npm run lint`     | Vérifie le code avec ESLint                  |
| `npm run typecheck`| Vérifie les types TypeScript                 |

## Structure du projet

```
NeuroBooth/
├── src/
│   ├── components/      # Composants React
│   │   ├── admin/       # Panneaux d'administration
│   │   │   ├── ui/      # Composants réutilisables (Toggle, AdminHeader, etc.)
│   │   ├── WelcomeScreen.tsx
│   │   ├── CountdownScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── PreviewScreen.tsx
│   │   └── AdminPanel.tsx
│   ├── context/         # Contexte React (AppContext)
│   ├── hooks/           # Hooks personnalisés (useMotor, useSupabaseSync)
│   ├── lib/             # Utilitaires (storage, supabase, logger)
│   └── types/           # Définitions TypeScript
├── supabase/            # Scripts SQL pour Supabase
│   ├── migrations/      # Migrations de base de données
└── package.json
```

## Utilisation

1. **Écran d'accueil** - Appuyez sur "Commencer" pour lancer une capture
2. **Compte à rebours** - 3, 2, 1...
3. **Capture** - La vidéo s'enregistre automatiquement
4. **Aperçu** - Visualisez la vidéo et partagez-la via QR code
5. **Admin** - Cliquez sur l'icône ⚙️ pour accéder aux paramètres (PIN par défaut: 1234)

## Nouveautés récentes

- ✅ Settings synchronisés avec la base de données Supabase
- ✅ UI améliorée pour la sélection des thèmes (avec prévisualisation)
- ✅ Mobile-first responsive design
- ✅ Composants réutilisables pour le panneau admin

## Licence

MIT
