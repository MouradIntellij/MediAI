# Projet 2 - MediAI : plateforme de gestion clinique intelligente et connectee

## 1. Objectif du projet

MediAI est une application web full stack qui simule une plateforme de gestion clinique intelligente. Elle permet a un etablissement de sante de gerer les patients, les rendez-vous, les consultations, les prescriptions, les roles utilisateurs, l'audit et certaines analyses cliniques assistees par IA.

Le projet est concu comme un projet pedagogique de type internship. L'objectif n'est pas seulement de produire une interface, mais de comprendre comment construire une application professionnelle complete : analyse des besoins, architecture, base de donnees, API securisee, frontend par role, Docker, seed de donnees, validation et documentation.

Le projet s'inspire de plateformes professionnelles comme Epic Systems ou Cerner, dans une version simplifiee et adaptee a l'apprentissage.

## 2. Vision fonctionnelle

MediAI repose sur trois roles principaux :

- `admin` : gere les comptes, les roles, l'audit, les indicateurs et la gouvernance de la plateforme.
- `doctor` : consulte l'historique du malade, cree des consultations, prescrit des medicaments et utilise l'aide IA.
- `nurse` : planifie les rendez-vous, consulte les disponibilites des medecins, confirme ou annule les rendez-vous.

Le role `patient` est prevu dans le modele de donnees, mais l'interface patient n'est pas encore developpee dans cette version.

## 3. Fonctionnalites implementees

### Authentification et securite

- Authentification par email et mot de passe.
- Generation d'un token JWT apres connexion.
- Conservation de la session cote frontend avec `localStorage`.
- Verification du token sur les routes protegees.
- Controle d'acces par role avec middleware Express.
- Validation des donnees entrantes avec `Zod`.
- Journal d'audit pour les actions sensibles.
- Protection API avec `Helmet`, rate limiting et CORS controle.

### Interface par role

L'interface n'est plus identique pour tous les utilisateurs. La navigation est filtree selon le role connecte.

#### Infirmiere

- Tableau de bord oriente planification.
- Calendrier interactif.
- Selection du medecin.
- Selection de la date.
- Affichage des creneaux disponibles et occupes.
- Creation de rendez-vous pour un patient.
- Confirmation d'un rendez-vous.
- Annulation d'un rendez-vous.
- Acces a la liste des patients.

#### Medecin

- Tableau de bord clinique.
- Dossier patient.
- Historique complet du malade :
  - consultations,
  - prescriptions,
  - rendez-vous.
- Creation de consultation.
- Saisie du diagnostic.
- Saisie des constantes vitales.
- Resume clinique et risque IA.
- Prescription guidee par type de maladie.
- Choix de medicaments recommandes selon la maladie.
- Dosage et frequence pre-remplis.
- Detection d'interactions medicamenteuses.

#### Admin

- Console d'administration.
- Liste des utilisateurs.
- Creation de comptes.
- Attribution des roles.
- Indicateurs globaux.
- Acces au journal d'audit.
- Acces a l'analyse IA.
- Supervision de l'activite.

### Gestion clinique

- Creation et consultation des patients.
- Gestion des allergies et conditions chroniques.
- Gestion des rendez-vous.
- Gestion des consultations.
- Gestion des prescriptions.
- Suivi medicamenteux.
- Donnees de demonstration creees automatiquement.
- Seed rendu idempotent pour eviter les doublons.
- Migration de nettoyage des doublons de demonstration.

## 4. Architecture globale

```text
Utilisateur
   |
   v
Frontend React / Vite
   |
   | HTTP REST + JWT
   v
Backend Node.js / Express
   |
   | SQL
   v
PostgreSQL
   |
   v
Redis pour cache analytics
```

Le frontend gere l'experience utilisateur et adapte les modules selon le role. Le backend centralise la securite, les validations, l'audit, les regles metier et les traitements IA. PostgreSQL stocke les donnees cliniques. Redis sert au cache de certaines statistiques.

## 5. Stack technique

- Frontend : React, Vite, CSS natif, lucide-react.
- Backend : Node.js, Express, JWT, bcrypt, Zod.
- Base de donnees : PostgreSQL.
- Cache : Redis.
- DevOps : Docker Compose.
- CI : GitHub Actions.
- Tests actuels : build frontend, verification syntaxique, tests manuels API.

## 6. Structure des dossiers

```text
MediAI/
  backend/
    Dockerfile
    package.json
    src/
      app.js                  Configuration Express
      server.js               Point d'entree API
      config/                 Environnement, PostgreSQL, Redis
      db/                     Migrations SQL et seed
      middleware/             Auth, roles, audit, validation, erreurs
      routes/                 Routes REST
      services/               JWT et logique IA
  frontend/
    Dockerfile
    nginx.conf
    package.json
    src/
      App.jsx                 Interface principale et modules par role
      api/client.js           Client API REST
      auth/AuthContext.jsx    Session utilisateur
      components/             Shell, metrics, badges
      pages/LoginPage.jsx     Connexion
      styles.css              Design responsive
  docs/
    PROJET_2_MEDIAI_EXPLICATION.md
  docker-compose.yml
  package.json
  README.md
```

## 7. Modele de donnees

Les tables principales sont definies dans `backend/src/db/001_init.sql`.

### `users`

Stocke les comptes applicatifs. Chaque utilisateur possede un role. Le mot de passe est stocke sous forme de hash `bcrypt`, jamais en clair.

Roles possibles :

- `admin`
- `doctor`
- `nurse`
- `patient`

### `patients`

Stocke le dossier administratif et clinique de base :

- nom,
- date de naissance,
- sexe,
- telephone,
- courriel,
- allergies,
- conditions chroniques,
- contact d'urgence.

### `appointments`

Stocke les rendez-vous entre un patient et un praticien.

Statuts possibles :

- `scheduled`
- `confirmed`
- `completed`
- `cancelled`

Une migration ajoute un index unique partiel pour eviter deux rendez-vous actifs sur le meme creneau medecin.

### `consultations`

Stocke :

- notes medicales,
- diagnostic,
- constantes vitales,
- resume IA,
- niveau de risque IA.

### `prescriptions`

Stocke :

- patient,
- medecin,
- medicament,
- dosage,
- frequence,
- date de debut,
- date de fin,
- instructions,
- statut.

### `medication_logs`

Stocke les evenements de suivi medicamenteux :

- prise normale,
- oubli,
- retard,
- reaction.

### `audit_logs`

Stocke les actions sensibles pour assurer la tracabilite.

## 8. Backend Express

Le backend expose une API REST sous `/api`.

### Routes d'authentification

- `POST /api/auth/login` : connexion et generation du JWT.
- `GET /api/auth/me` : recuperation de l'utilisateur connecte.

### Routes patients

- `GET /api/patients` : liste des patients.
- `GET /api/patients/:id` : detail patient.
- `POST /api/patients` : creation d'un patient.
- `PUT /api/patients/:id` : modification d'un patient.

### Routes rendez-vous

- `GET /api/appointments` : liste des rendez-vous.
- `POST /api/appointments` : creation d'un rendez-vous.
- `PATCH /api/appointments/:id/status` : modification du statut.

### Routes consultations

- `GET /api/consultations` : liste des consultations.
- `GET /api/consultations?patientId=...` : historique des consultations d'un patient.
- `POST /api/consultations` : creation avec analyse IA.

### Routes prescriptions

- `GET /api/prescriptions` : liste des prescriptions.
- `GET /api/prescriptions?patientId=...` : prescriptions d'un patient.
- `POST /api/prescriptions` : creation avec detection d'interactions.
- `POST /api/prescriptions/:id/logs` : suivi de prise medicamenteuse.

### Routes utilisateurs

- `GET /api/users` : liste des utilisateurs, reservee a l'admin.
- `POST /api/users` : creation d'un utilisateur, reservee a l'admin.
- `GET /api/users/practitioners` : liste des medecins et infirmieres.

### Routes analytics

- `GET /api/analytics/overview` : statistiques globales.
- `GET /api/analytics/audit` : journal d'audit, reserve a l'admin.

## 9. Intelligence artificielle

Le fichier `backend/src/services/aiService.js` contient trois fonctions pedagogiques :

- `summarizeClinicalText` : produit un resume simple des notes cliniques.
- `estimatePatientRisk` : calcule un niveau de risque selon l'age, les constantes vitales et les mots cles detectes.
- `detectMedicationInteractions` : detecte quelques interactions connues dans une liste de medicaments.

Dans un vrai systeme, cette logique devrait etre remplacee ou completee par :

- une API medicale certifiee,
- un moteur de regles cliniques,
- une base officielle de medicaments,
- un modele NLP specialise,
- un systeme de validation par professionnel de sante.

Important : l'IA de ce projet est une aide a la decision. Elle ne remplace pas le jugement clinique.

## 10. Prescription guidee

Le frontend contient un catalogue pedagogique de maladies et de medicaments recommandes.

Exemples :

- Hypertension : Lisinopril, Amlodipine, Hydrochlorothiazide.
- Diabete : Metformin, Gliclazide, Insuline glargine.
- Asthme : Salbutamol, Budesonide, Montelukast.
- Infection : Amoxicilline, Azithromycine, Cephalexine.
- Douleur : Acetaminophene, Ibuprofene, Naproxene.

Le medecin choisit une maladie, puis un medicament. Le dosage et la frequence sont proposes automatiquement. Lors de la creation, le backend verifie les interactions avec les prescriptions actives du patient.

## 11. Calendrier infirmiere

Le module infirmiere permet :

1. Selectionner un medecin.
2. Selectionner une date.
3. Voir les creneaux de 30 minutes entre 08:00 et 16:30.
4. Distinguer les creneaux disponibles et occupes.
5. Selectionner un patient.
6. Saisir le motif.
7. Creer un rendez-vous confirme.
8. Confirmer ou annuler un rendez-vous existant.

Ce module represente le role reel de l'infirmiere ou de la personne responsable de la coordination clinique.

## 12. Securite inspiree HIPAA

Le projet applique plusieurs principes inspires des standards de confidentialite medicale :

- Authentification obligatoire sur les routes cliniques.
- Controle d'acces par role.
- Mots de passe hashes avec `bcrypt`.
- JWT avec expiration.
- Validation stricte des entrees API.
- Journal d'audit des actions sensibles.
- Protection des headers HTTP avec `Helmet`.
- Limitation de requetes avec `express-rate-limit`.
- CORS limite aux origines autorisees.

Pour une vraie mise en production medicale, il faudrait ajouter :

- chiffrement des donnees au repos,
- chiffrement de champs sensibles,
- gestion avancee des consentements,
- rotation des secrets,
- sauvegardes chiffrees,
- supervision des acces,
- tests de penetration,
- journalisation inviolable,
- politiques de retention des donnees,
- audit legal et certification.

## 13. Docker et commande unique

Le projet peut etre lance avec une seule commande :

```bash
npm run dev
```

Cette commande execute :

```bash
docker compose up --build
```

Services demarres :

- `postgres` : base de donnees.
- `redis` : cache.
- `backend` : API Express.
- `frontend` : application React servie par Nginx.

Adresses :

- Frontend : `http://localhost:8090`
- API : `http://localhost:4001/health`

Le backend lance automatiquement :

```bash
npm run db:migrate
npm run db:seed
npm start
```

Le seed cree les comptes de demonstration et les donnees initiales. Il est idempotent : relancer Docker ne doit pas creer de doublons.

## 14. Comptes de demonstration

```text
admin@mediai.local / Password123!
doctor@mediai.local / Password123!
nurse@mediai.local / Password123!
```

Chaque compte affiche une interface differente.

## 15. GitHub Actions

Le pipeline `.github/workflows/ci.yml` execute :

- installation des dependances backend,
- installation des dependances frontend,
- demarrage de PostgreSQL et Redis comme services CI,
- migration de la base,
- build du frontend.

Cela permet de detecter rapidement les erreurs de compilation ou de schema.

## 16. Directives d'internship pour refaire le projet

Cette section donne aux etudiants une marche a suivre pour construire un projet similaire de maniere professionnelle.

### Phase 1 - Analyse du besoin

Objectif : comprendre le domaine avant de coder.

Travail demande :

1. Decrire le probleme a resoudre.
2. Identifier les utilisateurs :
   - administrateur,
   - medecin,
   - infirmiere,
   - patient futur.
3. Decrire les responsabilites de chaque role.
4. Lister les donnees sensibles.
5. Identifier les risques :
   - acces non autorise,
   - mauvaise prescription,
   - doublon de rendez-vous,
   - perte de donnees,
   - erreur de validation.

Livrables :

- document de vision,
- liste des roles,
- liste des fonctionnalites,
- diagramme simple du flux utilisateur.

### Phase 2 - Conception fonctionnelle

Objectif : transformer le besoin en modules.

Modules minimum :

1. Authentification.
2. Gestion des patients.
3. Gestion des rendez-vous.
4. Calendrier infirmiere.
5. Dossier medecin.
6. Consultations.
7. Prescriptions.
8. Administration.
9. Audit.
10. Tableau de bord.

Pour chaque module, definir :

- qui peut y acceder,
- quelles donnees sont affichees,
- quelles actions sont autorisees,
- quelles erreurs doivent etre gerees.

Livrables :

- backlog fonctionnel,
- maquettes simples,
- matrice roles / permissions.

### Phase 3 - Conception technique

Objectif : definir l'architecture avant l'implementation.

Choix recommandes :

- React pour le frontend.
- Express pour le backend.
- PostgreSQL pour les donnees relationnelles.
- Redis pour le cache.
- JWT pour l'authentification.
- Docker Compose pour l'environnement complet.

Elements a produire :

1. Diagramme d'architecture.
2. Modele de donnees.
3. Liste des routes API.
4. Strategie de securite.
5. Strategie de seed.
6. Strategie de migration.

Livrables :

- schema de base de donnees,
- documentation API initiale,
- architecture des dossiers.

### Phase 4 - Initialisation du projet

Objectif : creer la structure technique.

Etapes :

1. Creer un dossier racine `MediAI`.
2. Creer un dossier `backend`.
3. Creer un dossier `frontend`.
4. Initialiser `package.json` au niveau racine.
5. Initialiser le backend Node.js.
6. Initialiser le frontend Vite React.
7. Ajouter Docker Compose.
8. Ajouter `.env.example`.
9. Ajouter `.gitignore`.
10. Ajouter un README.

Scripts racine recommandes :

```json
{
  "scripts": {
    "install:all": "npm install --prefix backend && npm install --prefix frontend",
    "dev": "docker compose up --build",
    "build": "npm run build --prefix frontend",
    "db:migrate": "npm run db:migrate --prefix backend",
    "db:seed": "npm run db:seed --prefix backend"
  }
}
```

### Phase 5 - Base de donnees

Objectif : construire une base claire et extensible.

Etapes :

1. Creer la table `users`.
2. Creer la table `patients`.
3. Creer la table `appointments`.
4. Creer la table `consultations`.
5. Creer la table `prescriptions`.
6. Creer la table `medication_logs`.
7. Creer la table `audit_logs`.
8. Ajouter les index utiles.
9. Ajouter une migration de nettoyage ou contrainte pour eviter les doublons.

Bonnes pratiques :

- utiliser des UUID,
- ne jamais stocker les mots de passe en clair,
- ajouter des contraintes `CHECK`,
- ajouter des index sur les colonnes souvent filtrees,
- rendre les migrations rejouables.

### Phase 6 - Backend API

Objectif : construire une API REST securisee.

Etapes :

1. Configurer Express.
2. Configurer `dotenv`.
3. Configurer PostgreSQL avec `pg`.
4. Configurer Redis.
5. Ajouter le middleware d'erreurs.
6. Ajouter le middleware d'authentification JWT.
7. Ajouter le middleware de roles.
8. Ajouter le middleware d'audit.
9. Ajouter les schemas Zod.
10. Implementer les routes.

Routes minimum :

- `/api/auth`
- `/api/users`
- `/api/patients`
- `/api/appointments`
- `/api/consultations`
- `/api/prescriptions`
- `/api/analytics`

Regle importante :

Chaque route qui modifie des donnees doit verifier le role et ecrire dans l'audit si l'action est sensible.

### Phase 7 - Frontend React

Objectif : creer une interface utile pour chaque role.

Etapes :

1. Creer le client API.
2. Ajouter automatiquement le token JWT.
3. Creer le contexte d'authentification.
4. Creer la page de connexion.
5. Creer le layout principal.
6. Filtrer la navigation selon le role.
7. Creer les vues communes.
8. Creer les vues specifiques au medecin.
9. Creer les vues specifiques a l'infirmiere.
10. Creer les vues specifiques a l'admin.

Modules frontend attendus :

- `LoginPage`
- `Shell`
- `Dashboard`
- `Patients`
- `NurseSchedule`
- `DoctorWorkspace`
- `PrescriptionAssistant`
- `ConsultationForm`
- `AdminConsole`
- `Analytics`
- `Security`

Bonnes pratiques :

- une interface differente selon le role,
- des formulaires courts et clairs,
- des erreurs lisibles,
- des etats de chargement,
- un design responsive,
- pas de pages purement decoratives.

### Phase 8 - Calendrier infirmiere

Objectif : donner a l'infirmiere un role operationnel reel.

Etapes :

1. Charger les medecins via `/api/users/practitioners`.
2. Charger les patients via `/api/patients`.
3. Charger les rendez-vous via `/api/appointments`.
4. Generer les creneaux de 30 minutes.
5. Marquer les creneaux deja occupes.
6. Permettre la creation d'un rendez-vous.
7. Permettre l'annulation.
8. Permettre la confirmation.
9. Rafraichir la liste apres action.

Criteres de reussite :

- impossible de reserver visuellement un creneau occupe,
- les rendez-vous annules ne bloquent plus le planning,
- l'utilisateur comprend rapidement quoi faire.

### Phase 9 - Espace medecin

Objectif : donner au medecin une interface clinique utile.

Etapes :

1. Selectionner un patient.
2. Afficher son age, allergies et conditions chroniques.
3. Charger ses rendez-vous.
4. Charger ses consultations.
5. Charger ses prescriptions.
6. Fusionner ces donnees dans une timeline.
7. Ajouter un formulaire de consultation.
8. Ajouter un formulaire de prescription guidee.
9. Appeler l'API de detection d'interactions.
10. Afficher le resultat au medecin.

Criteres de reussite :

- le medecin voit l'historique avant de prescrire,
- le formulaire de prescription est rapide,
- les interactions sont visibles,
- l'IA est presentee comme une aide, pas comme une decision automatique.

### Phase 10 - Administration

Objectif : donner un role clair a l'admin.

Etapes :

1. Creer la route `GET /api/users`.
2. Creer la route `POST /api/users`.
3. Creer l'interface de liste des utilisateurs.
4. Creer le formulaire de creation de compte.
5. Afficher les indicateurs globaux.
6. Afficher le journal d'audit.
7. Restreindre ces modules au role `admin`.

Criteres de reussite :

- un medecin ne voit pas l'administration,
- une infirmiere ne voit pas l'administration,
- seul l'admin peut creer les comptes,
- l'audit est visible par l'admin.

### Phase 11 - Donnees de demonstration

Objectif : permettre au projet de fonctionner immediatement.

Etapes :

1. Creer un admin.
2. Creer un medecin.
3. Creer une infirmiere.
4. Creer un patient.
5. Creer un rendez-vous.
6. Creer une prescription.
7. Creer une consultation.
8. Rendre le seed idempotent.

Regle importante :

Le seed doit pouvoir etre relance plusieurs fois sans creer de doublons.

### Phase 12 - Docker

Objectif : simplifier le lancement du projet.

Etapes :

1. Creer un Dockerfile backend.
2. Creer un Dockerfile frontend.
3. Creer `docker-compose.yml`.
4. Ajouter PostgreSQL.
5. Ajouter Redis.
6. Ajouter le backend.
7. Ajouter le frontend.
8. Ajouter les healthchecks.
9. Lancer les migrations au demarrage backend.
10. Lancer le seed au demarrage backend.

Commande attendue :

```bash
npm run dev
```

### Phase 13 - Tests et verification

Objectif : prouver que le projet fonctionne.

Tests minimum :

1. Le frontend build sans erreur.
2. L'API `/health` repond.
3. Le login admin fonctionne.
4. Le login medecin fonctionne.
5. Le login infirmiere fonctionne.
6. L'infirmiere peut creer un rendez-vous.
7. Le medecin peut lire l'historique patient.
8. Le medecin peut creer une consultation.
9. Le medecin peut creer une prescription.
10. L'admin peut lister les utilisateurs.
11. Un role non autorise ne peut pas acceder aux routes reservees.

Commandes utiles :

```bash
npm run build
docker compose ps
docker compose logs backend --tail=100
```

### Phase 14 - Documentation

Objectif : rendre le projet comprehensible par un evaluateur ou une equipe.

Documents attendus :

- README de demarrage rapide.
- Document d'explication complet.
- Liste des comptes de demo.
- Description des roles.
- Routes API.
- Architecture.
- Modele de donnees.
- Limites et ameliorations futures.

### Phase 15 - Presentation finale

Plan de demonstration recommande :

1. Lancer `npm run dev`.
2. Ouvrir `http://localhost:8090`.
3. Se connecter comme infirmiere.
4. Montrer le calendrier.
5. Creer un rendez-vous.
6. Annuler ou confirmer un rendez-vous.
7. Se connecter comme medecin.
8. Ouvrir le dossier patient.
9. Montrer l'historique.
10. Creer une consultation.
11. Creer une prescription guidee.
12. Se connecter comme admin.
13. Creer un utilisateur.
14. Montrer l'audit.
15. Expliquer Docker, migrations, seed et securite.

## 17. Organisation internship suggeree

### Semaine 1 - Analyse et cadrage

- Comprendre le domaine.
- Definir les roles.
- Definir les fonctionnalites.
- Produire les maquettes.
- Produire le modele initial.

### Semaine 2 - Backend et base de donnees

- Creer les migrations.
- Creer les routes principales.
- Ajouter auth JWT.
- Ajouter roles et audit.
- Ajouter seed.

### Semaine 3 - Frontend commun

- Creer login.
- Creer layout.
- Creer client API.
- Creer dashboard.
- Creer patients.
- Gerer session et erreurs.

### Semaine 4 - Interfaces par role

- Creer calendrier infirmiere.
- Creer dossier medecin.
- Creer prescription guidee.
- Creer admin console.
- Filtrer navigation par role.

### Semaine 5 - Securite, Docker et qualite

- Finaliser Docker.
- Corriger CORS et ports.
- Ajouter migration de nettoyage.
- Tester les parcours.
- Corriger les bugs.

### Semaine 6 - Documentation et presentation

- Completer README.
- Completer document projet.
- Preparer la demonstration.
- Preparer les limites et ameliorations.
- Nettoyer le code.

## 18. Critere d'evaluation

Un projet similaire peut etre evalue selon ces criteres :

- Architecture claire.
- Lancement simple avec une commande.
- Separation backend / frontend.
- Base de donnees relationnelle correcte.
- Authentification fonctionnelle.
- Roles correctement appliques.
- Interfaces differentes selon les roles.
- Workflow infirmiere complet.
- Workflow medecin complet.
- Workflow admin complet.
- Validation des donnees.
- Audit des actions sensibles.
- Gestion des erreurs.
- Documentation claire.
- Code lisible et organise.
- Donnees de demonstration utiles.
- Projet presentable sans manipulation complexe.

## 19. Limites actuelles

- Le role patient existe dans le modele mais n'a pas encore d'interface dediee.
- Le calendrier est interactif mais reste simple.
- Le catalogue de medicaments est pedagogique et non medicalement certifie.
- L'IA est heuristique.
- Les tests automatises backend restent a ajouter.
- Il n'y a pas encore OpenAPI/Swagger.
- Il n'y a pas encore de messagerie securisee.
- Il n'y a pas encore de gestion multi-cliniques.
- Il n'y a pas encore de consentement patient.
- Il n'y a pas encore de chiffrement applicatif champ par champ.

## 20. Ameliorations futures

- Ajouter une interface patient.
- Ajouter un vrai calendrier mensuel et hebdomadaire.
- Ajouter Supertest pour les tests API.
- Ajouter Playwright pour les tests end-to-end.
- Ajouter Swagger/OpenAPI.
- Ajouter une base de medicaments officielle.
- Ajouter une messagerie securisee.
- Ajouter les notifications email ou SMS.
- Ajouter la gestion des disponibilites medecin.
- Ajouter la gestion des absences et vacances.
- Ajouter des rapports PDF.
- Ajouter l'export CSV admin.
- Ajouter le chiffrement des donnees sensibles.
- Ajouter une integration OpenAI ou Azure OpenAI pour les resumes cliniques.

## 21. Conclusion

MediAI demontre une architecture complete de plateforme clinique moderne : React, Express, PostgreSQL, Redis, JWT, controle d'acces par role, audit, logique IA isolee, Docker et CI. La version actuelle va au-dela d'une simple interface commune : chaque role possede maintenant un espace adapte a ses responsabilites reelles.

Le projet reste volontairement pedagogique, mais il donne une base solide pour apprendre comment construire une application professionnelle full stack dans un contexte sensible comme la sante.
