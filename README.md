# ArtisanConnect

Plateforme mobile-first de mise en relation entre artisans et clients (React + Supabase), basée sur le cahier des charges fourni.

## ✅ Ce qui est implémenté (MVP — Phases 1 à 3 du planning)

- **Authentification** : inscription (client / artisan), connexion, déconnexion, création automatique du profil via un trigger Supabase.
- **Profil artisan** : métier, description, ville/quartier, géolocalisation, disponibilité, badge « vérifié ».
- **Publications** : upload photo/vidéo (Supabase Storage), description, étiquetage automatique léger par mots-clés.
- **Fil d'actualité (feed)** : scroll vertical façon TikTok, bouton de contact rapide sur chaque publication.
- **Recherche & filtres** : par métier, ville, note minimale, disponibilité.
- **Assistant de recherche en langage naturel** : comprend des requêtes du type « plombier à Dakar » et applique les filtres (bouton baguette magique 🪄). C'est une V1 basée sur des mots-clés côté client — voir plus bas pour brancher un vrai chatbot IA.
- **Géolocalisation** : bouton « ma position », tri des artisans par proximité (distance à vol d'oiseau).
- **Contact direct** : boutons WhatsApp et Appel sur chaque profil/publication.
- **Avis & notation** : note de 1 à 5, commentaire, moyenne recalculée automatiquement (trigger SQL).
- **Photo de profil & photo de couverture** : upload direct depuis le profil (icône appareil photo), stockées sur Supabase Storage, visibles partout (fil, recherche, profil artisan).
- **« J'aime » sur les publications** : bouton façon Facebook avec compteur, activable uniquement connecté.
- **Barre de stories** : avatars des artisans disponibles en un coup d'œil en haut du fil.
- **Artisans suggérés** : carrousel des mieux notés, façon « Personnes que vous pourriez connaître ».
- **Mot de passe oublié** : lien email → page de réinitialisation dédiée (`/reinitialiser`).
- **Application installable (PWA)** : installable sur Android et iOS comme une vraie app, fonctionne partiellement hors-ligne, icônes et écran de démarrage inclus.
- **Assistant de recherche IA réel (V2)** : Edge Function Supabase qui appelle l'API Claude pour interpréter les requêtes en langage naturel, avec repli automatique sur l'ancienne logique par mots-clés si la fonction n'est pas déployée.
- **Design façon Facebook** : bleu #1877F2, fond gris clair, cartes blanches arrondies, avatar circulaire avec initiale par défaut, barre de navigation basse avec indicateur actif — pensé pour rester plus simple qu'un vrai Facebook (moins d'options, parcours plus direct).
- **Back-office admin de modération** : vérification des artisans (badge ✓), suppression des publications et avis abusifs, statistiques de la plateforme.
- **Recommandations personnalisées** : pour un utilisateur connecté, le fil met en avant les artisans en fonction de ses « j'aime » et avis passés (affinité par métier), de leur note, de leur badge vérifié et — si la géolocalisation est activée — de la distance. Sans historique, l'utilisateur voit les artisans les mieux notés. Chaque profil artisan propose aussi des « Artisans similaires » (même métier).
- **Messagerie interne** : chat en temps réel entre client et artisan directement dans l'app (bouton « Envoyer un message » sur chaque profil), en complément de WhatsApp/l'appel — utile pour garder un historique écrit sans quitter l'application.
- **Notifications push** : alerte reçue même app fermée dès qu'un nouveau message arrive (Android : dans le navigateur ou l'app installée ; iOS : app installée sur l'écran d'accueil, iOS 16.4+ uniquement — limite d'Apple, pas de l'app).
- **Analyse d'image par IA** : à l'ajout d'une photo de réalisation, Claude (vision) suggère automatiquement le métier concerné, une description et des mots-clés. Si la photo ne correspond pas au métier enregistré de l'artisan, un avertissement discret s'affiche (sans bloquer la publication).
- **Abonnement Premium (monétisation)** : les artisans peuvent payer un abonnement mensuel ou annuel (badge doré, mise en avant dans les recommandations/recherche/stories) via Wave, Orange Money, Free Money ou carte bancaire.

## 💰 Activer les paiements Premium (CinetPay)

C'est la seule fonctionnalité de ce projet qui implique de l'argent réel — lisez cette section avant de la mettre en production.

**Ce qui est déjà construit :** le parcours complet (choix du plan, redirection vers le paiement, retour et confirmation), la protection contre la fraude (le webhook ne fait jamais confiance à lui-même — il revérifie systématiquement le statut auprès de CinetPay avant d'activer quoi que ce soit), et la base de données (table `subscriptions`, colonne `premium_until` sur les artisans, RLS empêchant un utilisateur de s'auto-attribuer le statut premium en écrivant en base).

**Ce qu'il vous reste à faire :**

1. **Créer un compte marchand CinetPay** sur [cinetpay.com](https://cinetpay.com) (ou un autre agrégateur si vous préférez — voir plus bas). Il vous faudra vos documents d'entreprise (RCCM, pièce d'identité du dirigeant) ; la validation prend généralement 24 à 72h ouvrées.
2. Une fois validé, récupérez votre **API Key** et votre **Site ID** dans le tableau de bord CinetPay.
3. Déployez les deux fonctions de paiement et configurez les secrets :
   ```bash
   supabase functions deploy creer-abonnement
   supabase functions deploy verifier-abonnement
   supabase secrets set CINETPAY_APIKEY=votre_cle CINETPAY_SITE_ID=votre_site_id APP_URL=https://votredomaine.com
   ```
4. Testez avec de petits montants réels avant d'ouvrir au public — CinetPay ne propose pas toujours un mode sandbox complet selon le pays.

**Tarifs par défaut** (modifiables dans `supabase/functions/creer-abonnement/index.ts`, objet `PLANS`) : 2 000 FCFA/mois ou 20 000 FCFA/an. Ajustez selon votre marché.

**Sans cette configuration**, le bouton « Passer Premium » affiche une erreur claire à l'utilisateur (« Paiement indisponible pour le moment ») plutôt qu'un faux paiement — personne ne peut accidentellement penser avoir payé alors que rien n'a été traité.

**Autre agrégateur ?** Si vous préférez PayDunya, Hub2 ou un autre, seules les deux Edge Functions (`creer-abonnement` et `verifier-abonnement`) sont à adapter à leur API — le reste de l'application (base de données, UI, badges) ne change pas.

**Fiscalité et conformité :** ArtisanConnect ne gère aucune obligation légale à votre place (déclaration de revenus, TVA, conditions générales de vente). Renseignez-vous auprès d'un professionnel avant de facturer des utilisateurs réels au Sénégal.

## 🖼️ Activer l'analyse d'image par IA

Réutilise la même clé `ANTHROPIC_API_KEY` que l'assistant de recherche (si déjà configurée pour lui, il suffit de déployer cette fonction en plus) :

```bash
supabase functions deploy analyser-image
supabase secrets set ANTHROPIC_API_KEY=sk-ant-votre-cle
```

Sans cette fonction déployée, l'ajout de photo fonctionne normalement — juste sans suggestion automatique de métier/description/mots-clés (l'artisan les renseigne alors lui-même, comme dans la V1).

## 🔔 Activer les notifications push

Trois étapes, une seule fois :

**1. Générer une paire de clés VAPID** (identité de votre serveur pour signer les notifications) :
```bash
npx web-push generate-vapid-keys
```
Vous obtenez une clé publique et une clé privée.

**2. Configurer les clés :**
- Clé **publique** → dans `.env` du frontend : `VITE_VAPID_PUBLIC_KEY=...`
- Clé **privée** → en secret sur la Edge Function :
  ```bash
  supabase functions deploy send-push
  supabase secrets set VAPID_PUBLIC_KEY=votre_cle_publique VAPID_PRIVATE_KEY=votre_cle_privee VAPID_SUBJECT=mailto:contact@votredomaine.com
  ```

**3. Brancher le déclencheur** (dans le Dashboard Supabase, pas en SQL — l'URL du projet doit être connue) :
   - **Database → Webhooks → Create a new hook**
   - Table : `messages` · Événement : `Insert` · Type : `Supabase Edge Functions` · Function : `send-push`

Une fois ces 3 étapes faites, chaque utilisateur peut activer les notifications depuis **Mon profil → Notifications push**. Sans configuration, ce bloc reste discrètement inactif — aucune erreur visible, la messagerie continue de fonctionner normalement (juste sans alertes en arrière-plan).

## 💬 Activer la messagerie interne (Realtime)

Le schéma active déjà la table `messages` sur la publication `supabase_realtime`. Si votre projet Supabase a été créé **avant** l'ajout de cette fonctionnalité, il suffit de ré-exécuter `schema.sql` (idempotent, comme toujours). Si le Realtime ne semble pas fonctionner après ça, vérifiez dans **Database → Replication** que la table `public.messages` est bien cochée pour la publication `supabase_realtime`.

## 🛡️ Back-office admin

Il n'existe pas d'inscription publique en tant qu'admin (par sécurité). Pour créer votre premier compte admin :

1. Inscrivez-vous normalement sur l'app (en tant que client, par exemple).
2. Dans Supabase → **SQL Editor**, exécutez :
   ```sql
   update public.profiles set role = 'admin' where id = 'uuid-de-votre-compte';
   ```
   (trouvez l'UUID dans **Authentication → Users**, ou via `select id, nom_complet from public.profiles;`)
3. Reconnectez-vous (ou rafraîchissez la page) : un bloc « Administration » apparaît en haut de votre page **Mon profil**, menant vers `/admin`.

Depuis le back-office, un admin peut : voir les statistiques globales, activer/désactiver le badge « vérifié » d'un artisan, et supprimer toute publication ou avis (les règles de sécurité — RLS — l'autorisent explicitement, tout le reste de la plateforme reste inaccessible en écriture pour un admin, par exemple il ne peut pas modifier le contenu d'un profil à la place de son propriétaire).

## 📱 Installer l'application (PWA)

L'application est une **Progressive Web App** : pas besoin de passer par l'App Store ou le Play Store.

- **Android (Chrome)** : une bannière « Installer ArtisanConnect » apparaît automatiquement en bas de l'écran. Vous pouvez aussi utiliser le menu ⋮ → « Installer l'application ».
- **iPhone / iPad (Safari)** : une bannière apparaît avec des instructions. Le principe : bouton Partager 􀈂 → « Sur l'écran d'accueil ».

**Important** : l'installation PWA nécessite **HTTPS** (ou `localhost` en développement). Un simple `npm run preview` en local fonctionne pour tester ; en production, déployez sur un hébergeur qui fournit HTTPS automatiquement (Vercel, Netlify, etc. — tous le font par défaut).

Pour vérifier que tout est conforme, ouvrez l'app dans Chrome → outils de développement → onglet **Lighthouse** → catégorie **PWA**.

### Personnaliser les icônes

Les icônes se trouvent dans `public/icons/` et `public/apple-touch-icon.png`. Remplacez-les par votre propre logo (192×192, 512×512, et une version 512×512 « maskable » avec le contenu centré dans les 66% du canevas — [testez ici](https://maskable.app/)), en gardant les mêmes noms de fichiers.

## 🤖 Activer le vrai chatbot IA (assistant de recherche)

L'assistant de recherche (bouton 🪄) est déjà branché sur une Edge Function Supabase qui appelle Claude. Il ne reste qu'à la déployer :

```bash
# Installer la CLI Supabase si besoin : https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
supabase functions deploy assistant-recherche
supabase secrets set ANTHROPIC_API_KEY=sk-ant-votre-cle
```

Tant que la fonction n'est pas déployée (ou que la clé API n'est pas configurée), l'application **continue de fonctionner normalement** grâce à un repli automatique sur une interprétation locale par mots-clés — aucune erreur visible pour l'utilisateur, juste un petit message discret indiquant que l'IA n'est pas active côté serveur.

## ⚠️ Si vous aviez déjà exécuté `schema.sql` avant cette mise à jour

Une colonne `cover_url` et une table `post_likes` ont été ajoutées. Ré-exécutez simplement `supabase/schema.sql` dans le SQL Editor : toutes les instructions sont idempotentes (`if not exists`, `on conflict do nothing`), donc cela ne dupliquera rien et ajoutera juste ce qui manque.

## 🎉 Couverture du cahier des charges

Toutes les fonctionnalités listées dans le cahier des charges original sont désormais implémentées, y compris la partie 5 (Intelligence Artificielle : chatbot de recherche, analyse d'image, recommandations) et la partie 11 (modèle économique freemium). Les extensions ajoutées au-delà du document initial (messagerie interne, notifications push, back-office admin, PWA installable) répondent aux options « V2 » qui y étaient mentionnées.

**Seul point d'attention avant un vrai lancement commercial :** l'abonnement Premium nécessite un compte marchand CinetPay validé (voir section paiements ci-dessus) — c'est une démarche administrative de votre côté, pas quelque chose que le code peut contourner.

S'il y a un point que vous voulez approfondir, corriger, ou une nouvelle direction à prendre (multi-langue, version web pour les artisans sans smartphone, commission sur mise en relation plutôt qu'abonnement…), dites-le-moi.

## 🏗️ Stack technique

- **Frontend** : React 19 + Vite + React Router + Tailwind CSS v4 + lucide-react
- **Backend** : Supabase (Auth, PostgreSQL, Storage, Row Level Security)

## 🚀 Installation

### 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → **New project**.
2. Une fois créé, ouvrez **SQL Editor** → **New query**, collez le contenu de `supabase/schema.sql`, puis **Run**. Cela crée toutes les tables, les triggers (création automatique de profil, recalcul des notes) et les règles de sécurité (RLS), ainsi que le bucket de stockage `media`.
3. Dans **Authentication → Providers**, l'auth par email est activée par défaut. Vous pouvez désactiver la confirmation par email pendant les tests dans **Authentication → Settings**.
3bis. Dans **Authentication → URL Configuration**, ajoutez `http://localhost:5173/reinitialiser` (et l'URL de votre domaine en production) à la liste des **Redirect URLs**, sinon le lien « mot de passe oublié » échouera.
4. Récupérez `Project URL` et `anon public key` dans **Project Settings → API**.

### 2. Configurer le frontend

```bash
cp .env.example .env
# Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`. Ouvrez les outils de développement de votre navigateur en mode mobile (ou testez directement sur votre téléphone via le réseau local) pour l'expérience prévue.

### 3. Build de production

```bash
npm run build
npm run preview
```

Le dossier `dist/` peut être déployé sur Vercel, Netlify, ou tout hébergeur statique.

## 🤖 Brancher un vrai chatbot IA (V2)

L'assistant de recherche actuel (bouton 🪄 sur la page Recherche) fonctionne par correspondance de mots-clés, sans appel réseau. Pour le remplacer par un vrai chatbot IA :

1. Créez une **Supabase Edge Function** qui appelle l'API Anthropic ou OpenAI avec la requête utilisateur et retourne un JSON structuré `{ metier, ville }`.
2. Remplacez la fonction `runAssistant()` dans `src/pages/Search.jsx` par un appel à cette Edge Function via `supabase.functions.invoke(...)`.
3. Ne mettez jamais votre clé d'API IA dans le frontend : elle doit rester côté Edge Function (variable d'environnement Supabase).

## 📁 Structure du projet

```
src/
  components/     Composants réutilisables (cartes, navigation, boutons de contact, PWA…)
  context/        Contexte d'authentification global
  lib/            Client Supabase + fonctions utilitaires (distance, formatage, install PWA, push, messages)
  pages/          Feed, Recherche, Connexion, Inscription, Profil artisan, Publier, Mon profil, Messages
  sw.js           Service worker personnalisé (cache + notifications push)
public/
  icons/          Icônes de l'application (192, 512, maskable)
  apple-touch-icon.png
supabase/
  schema.sql      Schéma complet à exécuter dans Supabase (tables, RLS, triggers, storage, realtime)
  functions/
    assistant-recherche/   Edge Function : chatbot IA de recherche (appel API Claude)
    analyser-image/        Edge Function : analyse d'image par vision IA (appel API Claude)
    send-push/              Edge Function : envoi des notifications push (Web Push)
    creer-abonnement/       Edge Function : initie un paiement Premium (CinetPay)
    verifier-abonnement/    Edge Function : webhook de confirmation de paiement (CinetPay)
```

## 🎨 Design

Direction visuelle inspirée du Sénégal : indigo profond (tissus wax), ocre marigold, terre de latérite, sable chaud. Typographies Fraunces (display) + Manrope (texte). Le motif pointillé et le liseré diagonal (wax-divider) servent de signature visuelle discrète.
