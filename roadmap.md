# 🚀 Roadmap & Vision - NeuroBooth 360 (Mobile Edition)

Bienvenue dans la feuille de route officielle de **NeuroBooth 360**, l'application ultime de Photobooth 360 conçue **exclusivement pour les appareils mobiles**. 

Ce document détaille les fonctionnalités actuelles et les **20 nouvelles innovations majeures** prévues pour transformer votre smartphone en une véritable machine de production 360 professionnelle.

---

## 🎯 Vision Mobile-Only
L'objectif est d'exploiter à 100% les capacités matérielles des smartphones modernes (Gyroscopes, puces IA, Ultra Grand Angle, puces d'encodage vidéo, Bluetooth Low Energy) pour offrir une expérience fluide, rapide et sans fil, sans avoir besoin d'un PC lourd.

---

## 🟢 Phase 1 : Fondations (Version Actuelle)
> **Statut : Déployée ✅** | Les bases solides de l'application.

### 🎥 Capture & Vidéo
- ✅ **Capture Mobile Native** : Utilisation des caméras du smartphone.
- ✅ **Ralenti Automatique (Slo-Mo)** : Effets de ralenti paramétrables (Début, Durée, Vitesse).
- ✅ **Watermark Dynamique** : Incrustation de texte et de logo sur la vidéo finale.

### 🎨 Expérience Utilisateur
- ✅ **Design Mobile-First** : Interface optimisée pour une utilisation tactile.
- ✅ **Multi-Thèmes** : 4 thèmes visuels complets (Dark, Neon, Elegant, Party).
- ✅ **Compte à rebours animé** : Préparation des invités avant la rotation.

### ⚙️ Hardware & Connectivité
- ✅ **Contrôle Moteur ESP32** : Connexion Bluetooth (BLE) et WebSerial.
- ✅ **Contrôle LED** : Synchronisation des animations du bandeau LED (FastLED) avec le moteur.
- ✅ **Mode Hors-Ligne** : Fonctionnement complet sans internet avec synchronisation différée.

### ☁️ Cloud & Partage
- ✅ **Supabase Sync** : Sauvegarde des paramètres et vidéos dans le cloud.
- ✅ **Partage par QR Code** : Scan instantané par les invités pour récupérer leur vidéo.
- ✅ **Stockage Local** : Rétention des vidéos dans IndexedDB.

### 🔒 Administration
- ✅ **Mode Kiosque** : Verrouillage par code PIN pour éviter les mauvaises manipulations.
- ✅ **Statistiques d'utilisation** : Suivi du nombre de vidéos générées.

---

## 🟡 Phase 2 : Optimisation Mobile & Réseaux Sociaux
> **Statut : En cours de développement 🚧** | Focus sur le partage et l'expérience mobile.

| Fonctionnalité | Description | Priorité |
| :--- | :--- | :---: |
| 📱 **1. Support Caméra Ultra Grand-Angle (0.5x)** | Utilisation de l'objectif ultra-large natif du smartphone pour ne couper personne dans le cadre. | 🔥 Haute |
| ⚡ **2. Partage AirDrop / Nearby Share** | Bouton natif pour transférer la vidéo instantanément sans internet via le protocole OS. | 🔥 Haute |
| 🎵 **3. Incrustation Audio (Audio Sync)** | Ajouter une musique de fond libre de droits automatiquement à la vidéo générée. | ⭐️ Moyenne |
| 🔁 **4. Mode Boomerang** | Lecture de la vidéo à l'endroit puis à l'envers, idéal pour Instagram et TikTok. | 🔥 Haute |
| 💬 **5. Partage SMS / WhatsApp Direct** | Envoi direct du lien ou de la vidéo compressée via les applications de messagerie natives. | 🔥 Haute |
| 🔋 **6. Mode Économie d'Énergie (Battery Saver)** | Réduction du framerate de la preview et baisse de la luminosité entre deux captures. | ⭐️ Moyenne |
| 📐 **7. Verrouillage AF/AE (Focus & Expo)** | Bloquer la mise au point et l'exposition pour éviter les flashs/flous pendant la rotation. | 🔥 Haute |

---

## 🟠 Phase 3 : IA & Matériel Avancé
> **Statut : Planifié 📅** | L'intelligence artificielle au service de l'image.

| Fonctionnalité | Description | Priorité |
| :--- | :--- | :---: |
| 🤖 **8. Déclenchement Gestuel / Vocal** | Lancer le compte à rebours en levant la main ou en disant "Cheese" / "Start". | ⭐️ Moyenne |
| ✨ **9. Filtre Beauté IA Temps Réel** | Lissage de la peau et ajustement de l'éclairage du visage sans latence post-prod. | 🔥 Haute |
| ⚖️ **10. Stabilisation Gyroscopique (EIS)** | Utiliser les données du gyroscope du téléphone pour stabiliser logiciellement les vibrations du bras 360. | 🔥 Haute |
| 🌡️ **11. Moniteur de Surchauffe (Thermal Alert)** | Alerte intelligente si le téléphone chauffe trop, pour éviter la coupure de la caméra en plein événement. | ⭐️ Moyenne |
| ⌚ **12. Contrôle via Apple Watch / Wear OS** | Déclencher le bras moteur et la caméra depuis une montre connectée au poignet de l'opérateur. | 🧊 Basse |
| 💡 **13. Contrôle Ring Light RGB (Bluetooth)** | Gérer la couleur et l'intensité de la lumière annulaire externe directement depuis l'app. | ⭐️ Moyenne |

---

## 🔴 Phase 4 : Professionnalisation & Écosystème
> **Statut : Futur 🚀** | Des outils pour les agences d'événementiel.

| Fonctionnalité | Description | Priorité |
| :--- | :--- | :---: |
| 📺 **14. Mode "Live View" (Écran Déporté)** | Diffuser la galerie ou la preview en direct sur un iPad/Tablette externe via WiFi Direct. | 🔥 Haute |
| 🏃 **15. Auto-Start par Détection de Mouvement** | Le téléphone détecte que le bras commence à tourner (accéléromètre) et lance l'enregistrement. | ⭐️ Moyenne |
| 🎟️ **16. Apple Wallet / Google Pass** | Fournir le lien de téléchargement sous forme de Pass dans le Wallet pour une rétention premium. | 🧊 Basse |
| 📍 **17. Geotagging d'Événement** | Ajouter les métadonnées GPS et le nom de l'événement directement dans les EXIF de la vidéo MP4. | 🧊 Basse |
| 🧹 **18. Auto-Nettoyage Intelligent du Stockage** | Supprimer automatiquement les vidéos locales les plus anciennes si le téléphone a moins de 5Go d'espace libre. | 🔥 Haute |
| 🎬 **19. Compression Matérielle HEVC (H.265)** | Export vidéo plus rapide et 50% plus léger en utilisant la puce matérielle du téléphone. | 🔥 Haute |
| 🔒 **20. Mode "Accès Guidé" (Kiosk OS)** | Intégration des APIs pour verrouiller le téléphone sur l'app (empêcher de revenir à l'écran d'accueil iOS/Android). | ⭐️ Moyenne |

---

## 📊 Statistiques de la Roadmap
- **Fonctionnalités réalisées :** 15+
- **Nouvelles fonctionnalités prévues :** 20
- **Objectif principal :** Autonomie, performance mobile, et viralité.

---
*Document généré et mis à jour le 09 Juin 2026. NeuroBooth - The Ultimate Mobile 360 Experience.*