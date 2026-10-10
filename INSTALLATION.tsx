MON APEL — FINANCES — LOT 1 / SOCLE

Contenu livré (uniquement fichiers nouveaux ou modifiés) :
- src/main.tsx : branchement du module financier dans la navigation existante
- src/finance/FinanceModule.tsx : module financier, tableau de bord, recettes/dépenses, comptes, catégories, exercice, journal CSV
- src/finance/finance.css : styles isolés
- supabase/01-finances-socle.sql : nouvelles tables, droits RLS, audit et catégories

INSTALLATION
1. Sauvegarder le dépôt GitHub et faire un export de la base Supabase.
2. Supabase > SQL Editor : exécuter 01-finances-socle.sql UNE FOIS, après la migration superadmin.
3. GitHub : remplacer src/main.tsx et ajouter les deux fichiers sous src/finance/.
4. Commit : Vercel reconstruit automatiquement.
5. Dans Bureau > Finances > Paramètres comptables : créer un exercice et au moins un compte.
6. Saisir une recette et une dépense de test, les marquer payées et vérifier les totaux.
7. Tester les accès trésorier, président et utilisateur non habilité.

PORTÉE DU LOT 1
Fonctionnels : exercices ouverts, comptes et soldes initiaux, catégories, journal des recettes/dépenses, synthèse des opérations encaissées/payées, audit serveur, RLS, export CSV.
NON livrés dans ce lot : export XLSX multi-onglets, PDF, factures, stocks, ventes, budgets, justificatifs, rapprochement bancaire, validation à deux personnes, clôture et contrepassation.
Les onglets futurs sont visibles comme rubriques à venir, sans données fictives.
Ne pas utiliser en production réelle pour une comptabilité complète avant les lots suivants et les tests d'intégration.

NOTE : compilation et tests Supabase réels non vérifiés ici ; npm install n'a pas abouti dans cet environnement.
