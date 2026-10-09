# Mon APEL — version 1.0

Application React/Vite + Supabase + Vercel. Mini-site parents et cockpit privé.

## Installation

1. Créer un projet Supabase dédié.
2. Dans Supabase SQL Editor, exécuter `supabase/schema.sql` sur une base vierge.
3. Dans Supabase > Authentication > Users, créer les six utilisateurs du bureau (désactiver les inscriptions publiques dans les réglages Auth).
4. Dans SQL Editor, attribuer manuellement le rôle au président (adapter l'adresse e-mail) :

```sql
update public.profiles set full_name='Président APEL',role='president',active=true
where id=(select id from auth.users where email='president@example.org');
```

Répéter pour les autres membres avec `vice_president`, `secretaire`, `vice_secretaire`, `tresorier`, `vice_tresorier`.
5. Copier `.env.example` en `.env.local`, renseigner l'URL et la **publishable key** Supabase (jamais la secret/service_role key).
6. `npm install` puis `npm run dev`.
7. Créer un dépôt GitHub, pousser le projet et le relier à Vercel. Framework preset **Vite**, commande de build `npm run build`, dossier de sortie `dist`. Le fichier `vercel.json` configure le fallback SPA. Définir les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans Vercel.
8. Dans Supabase Auth > URL Configuration, renseigner l'URL Vercel du site et les redirect URLs appropriées.

## Modules inclus

- Site public : accueil, actualités publiées, agenda public, présentation, soumission d'idées et préoccupations.
- Espace privé : connexion, tableau de bord, idées, projets, tâches, événements, finances, bénévoles, réunions, catalogue documentaire, actualités, préoccupations et vue gouvernance.
- RLS par rôle : le bureau est habilité, finances limitées aux rôles financiers, préoccupations aux rôles de représentation/secrétariat. Les visiteurs anonymes ne voient que les événements publics et actualités publiées.

## Limites et étapes obligatoires avant ouverture aux familles

Cette livraison est un **socle applicatif fonctionnel**, pas un logiciel associatif entièrement finalisé. Le pilotage de projets avancé (Kanban déplaçable, votes, commentaires, brainstorming en temps réel, jalons, dépendances, Gantt), les paiements HelloAsso, les relances, l'IA, l'envoi d'e-mails, les exports comptables, les pièces jointes réelles, l'upload Supabase Storage et l'administration des invitations dans l'interface ne sont pas encore implémentés. Les champs `project_id`, `owner_id`, etc. existent en base pour préparer ces évolutions.

**Sécurité** : ajouter CAPTCHA et limitation de débit sur les deux formulaires publics via fonction Edge/Vercel; sinon risque de spam et d'abus. Ajouter vérification d'e-mail, journal d'audit, sauvegardes, tests RLS automatisés, tests d'accessibilité et contrôle de la conservation. Le contrôle de saisie actuel n'est pas une protection antispam. Les formulaires publics ne doivent pas être ouverts avant ces mesures.

**RGPD** : rédiger mentions légales, politique de confidentialité, durées de conservation, procédure d'exercice des droits, règles d'accès et gouvernance des données. Éviter les informations sensibles relatives aux mineurs. Définir les relations avec l'établissement et les responsabilités de traitement.

**Finances** : le module enregistre des opérations simples; il ne remplace pas un logiciel de comptabilité certifié ni une validation de dépenses. Les écritures restent modifiables : prévoir une piste d'audit avant usage comptable réel.

**Bureau** : les invitations et les rôles se gèrent actuellement dans Supabase, non dans l'application. Ne jamais permettre à un membre de modifier son propre rôle.

**Contenu** : remplacer « Mon APEL » par le nom de l'association, ajouter coordonnées, statuts, logo et charte graphique. Le texte de bienvenue affiché en l'absence d'actualités n'est qu'un contenu de démonstration.


## Déploiement GitHub → Vercel

1. Créer un dépôt GitHub **privé** et y importer le contenu de ce dossier (à la racine du dépôt, pas dans un sous-dossier). Ne jamais committer `.env.local`.
2. Dans Vercel, **Add New → Project → Import Git Repository** et sélectionner le dépôt.
3. Vérifier le preset Vite, build `npm run build`, output `dist`.
4. Dans **Settings → Environment Variables**, définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` pour Production, Preview et Development selon les environnements utilisés. **Ne jamais renseigner une clé service_role/secret dans une variable VITE_**.
5. Déployer. Dans Supabase **Authentication → URL Configuration**, mettre l'URL de production Vercel en **Site URL** et ajouter les URLs de redirection autorisées (y compris les domaines de prévisualisation nécessaires).
6. Pour un domaine personnalisé, le configurer dans **Vercel → Project → Settings → Domains**, puis mettre à jour Supabase.
7. Tester en production l'authentification, la récupération de mot de passe, les permissions RLS de chaque rôle et la confidentialité des préoccupations avant d'ouvrir aux familles.

**Note :** les fonctions publiques de soumission exigent une protection anti-spam côté serveur avant ouverture. Aucun secret Supabase ne doit être exposé au navigateur.
