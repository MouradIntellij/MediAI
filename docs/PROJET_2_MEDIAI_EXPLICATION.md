# Projet 2 - MediAI : plateforme de gestion clinique intelligente et connectee

## 1. Objectif du projet

MediAI est une application web full stack qui aide un etablissement de sante a gerer le parcours patient : creation du dossier, planification des rendez-vous, suivi des consultations, prescriptions, surveillance de la prise de medicaments et analyse intelligente des donnees cliniques.

Le projet s'inspire de plateformes professionnelles comme Epic Systems ou Cerner, mais dans une version pedagogique adaptee a un projet academique. L'objectif principal est de montrer une architecture moderne, securisee et extensible.

## 2. Fonctionnalites implementees

- Authentification securisee avec JWT.
- Roles utilisateurs : `admin`, `doctor`, `nurse`, `patient`.
- Gestion des patients : identite, contact, allergies, conditions chroniques, contact d'urgence.
- Gestion des rendez-vous : patient, praticien, date, statut, motif et lieu.
- Gestion des consultations : notes medicales, diagnostic, constantes vitales et resultat IA.
- Gestion des prescriptions : medicament, dosage, frequence, dates et statut.
- Suivi medicamenteux : journal de prise, oubli, retard ou reaction.
- Analyse intelligente : resume NLP simplifie, score de risque, detection d'interactions medicamenteuses.
- Tableau de bord : indicateurs patients, rendez-vous, prescriptions et risques.
- Journal d'audit : tracabilite des actions sensibles.
- Securite API : validation des donnees, rate limiting, headers Helmet, CORS controle.
- Docker Compose : PostgreSQL, Redis, backend et frontend.
- CI GitHub Actions : installation, migration base de donnees et build frontend.

## 3. Architecture globale

```text
Utilisateur
   |
   v
Frontend React (Vite)
   |
   | API REST + JWT
   v
Backend Node.js / Express
   |
   | SQL
   v
PostgreSQL
   |
   v
Redis cache optionnel pour analytics
```

Le frontend affiche les ecrans metier et consomme les routes REST. Le backend centralise la logique de securite, la validation, les acces SQL et les traitements IA. PostgreSQL stocke les donnees cliniques. Redis accelere certaines lectures analytiques, mais reste optionnel en developpement.

## 4. Structure des dossiers

```text
MediAI/
  backend/
    src/
      app.js                  Configuration Express
      server.js               Point d'entree API
      config/                 Environnement, PostgreSQL, Redis
      db/                     Migration SQL et seed
      middleware/             Auth, roles, audit, validation, erreurs
      routes/                 Routes REST
      services/               JWT et logique IA
  frontend/
    src/
      App.jsx                 Navigation principale
      api/client.js           Client API REST
      auth/AuthContext.jsx    Session utilisateur
      components/             Shell, metrics, badges
      pages/LoginPage.jsx     Connexion
      styles.css              Design responsive
  docs/
    PROJET_2_MEDIAI_EXPLICATION.md
```

## 5. Modele de donnees

Les tables principales sont definies dans `backend/src/db/001_init.sql`.

### `users`

Stocke les comptes applicatifs. Chaque utilisateur possede un role. Le mot de passe est stocke sous forme de hash `bcrypt`, jamais en clair.

### `patients`

Stocke le dossier administratif et clinique de base : nom, naissance, sexe, contacts, allergies, conditions chroniques et contact d'urgence.

### `appointments`

Stocke les rendez-vous entre un patient et un praticien. Le statut peut etre `scheduled`, `confirmed`, `completed` ou `cancelled`.

### `consultations`

Stocke les notes de consultation, diagnostic, constantes vitales et resultats IA : resume et niveau de risque.

### `prescriptions`

Stocke les traitements prescrits : medicament, dosage, frequence, dates et statut.

### `medication_logs`

Stocke les evenements de suivi medicamenteux : prise normale, oubli, retard ou reaction.

### `audit_logs`

Stocke les actions sensibles pour assurer la tracabilite.

## 6. Backend Express

Le backend expose une API REST sous `/api`.

### Routes principales

- `POST /api/auth/login` : connexion et generation du JWT.
- `GET /api/auth/me` : recuperation de l'utilisateur connecte.
- `GET /api/patients` : liste des patients.
- `POST /api/patients` : creation d'un patient.
- `GET /api/appointments` : liste des rendez-vous.
- `POST /api/appointments` : creation d'un rendez-vous.
- `PATCH /api/appointments/:id/status` : modification du statut.
- `GET /api/consultations` : liste des consultations.
- `POST /api/consultations` : creation avec analyse IA.
- `GET /api/prescriptions` : liste des prescriptions.
- `POST /api/prescriptions` : creation avec detection d'interactions.
- `POST /api/prescriptions/:id/logs` : suivi de prise medicamenteuse.
- `GET /api/analytics/overview` : statistiques globales.
- `GET /api/analytics/audit` : journal d'audit, reserve a l'admin.

### Validation

Les donnees entrantes sont validees avec `Zod`. Cela evite d'inscrire dans la base des donnees incompletes ou mal formees.

### Authentification et roles

Le middleware `authenticate` verifie le token JWT. Le middleware `authorize` verifie le role. Exemple : une prescription ne peut etre creee que par `admin` ou `doctor`.

## 7. Intelligence artificielle

Le fichier `backend/src/services/aiService.js` contient trois fonctions :

- `summarizeClinicalText` : produit un resume simple des notes cliniques.
- `estimatePatientRisk` : calcule un score de risque selon l'age, les constantes vitales et les mots cles detectes.
- `detectMedicationInteractions` : detecte quelques interactions connues dans une liste de medicaments.

Dans un vrai systeme, ce service serait remplace ou complete par :

- une API medicale certifiee,
- un modele NLP pour extraire symptomes et diagnostics,
- un moteur de regles cliniques,
- ou un modele de prediction entraine sur des donnees anonymisees.

Important : l'IA du projet est une aide a la decision, pas un remplacement du jugement clinique.

## 8. Securite inspiree HIPAA

Le projet applique plusieurs principes inspires des standards de confidentialite medicale :

- Authentification obligatoire sur les routes cliniques.
- Controle d'acces par role.
- Mots de passe hashes avec `bcrypt`.
- JWT avec expiration.
- Validation stricte des entrees API.
- Journal d'audit des actions sensibles.
- Protection des headers HTTP avec `Helmet`.
- Limitation de requetes avec `express-rate-limit`.
- CORS limite a l'origine du frontend.

Pour une vraie mise en production medicale, il faudrait ajouter :

- chiffrement des donnees au repos,
- gestion avancee des consentements,
- rotation des secrets,
- sauvegardes chiffrees,
- supervision des acces,
- tests de penetration,
- politiques de retention des donnees,
- journalisation inviolable.

## 9. Frontend React

L'interface est organisee comme un outil de travail clinique. L'utilisateur se connecte puis accede aux vues :

- Tableau clinique.
- Patients.
- Rendez-vous.
- Consultations.
- Prescriptions.
- Analyse IA.
- Securite.

Le fichier `frontend/src/api/client.js` ajoute automatiquement le token JWT dans les appels API. Le contexte `AuthContext` conserve la session dans `localStorage`.

## 10. Docker

Le fichier `docker-compose.yml` lance quatre services :

- `postgres` : base de donnees.
- `redis` : cache.
- `backend` : API Express.
- `frontend` : application React servie par Nginx.

Commande :

```bash
docker compose up --build
```

L'API lance automatiquement :

```bash
npm run db:migrate
npm run db:seed
npm start
```

## 11. GitHub Actions

Le pipeline `.github/workflows/ci.yml` execute :

- installation des dependances backend,
- installation des dependances frontend,
- demarrage de PostgreSQL et Redis comme services CI,
- migration de la base,
- build du frontend.

Cela permet de detecter rapidement les erreurs de compilation ou de schema.

## 12. Etapes pour presenter le projet

1. Lancer le projet avec Docker.
2. Ouvrir `http://localhost:8090`.
3. Se connecter avec `doctor@mediai.local` et `Password123!`.
4. Montrer le tableau de bord.
5. Montrer la liste des patients.
6. Ajouter un patient.
7. Montrer les rendez-vous.
8. Montrer les prescriptions.
9. Expliquer que la creation d'une consultation calcule un resume IA et un niveau de risque.
10. Se connecter comme `admin@mediai.local` pour montrer le journal d'audit.
11. Expliquer les protections de securite inspirees HIPAA.
12. Montrer le fichier GitHub Actions pour la partie DevOps.

## 13. Limites actuelles et ameliorations possibles

- Ajouter les tests automatises backend avec Supertest.
- Ajouter un vrai calendrier interactif.
- Ajouter des formulaires complets pour rendez-vous, consultation et prescription.
- Ajouter une messagerie securisee patient-medecin.
- Brancher une vraie API medicale pour interactions medicamenteuses.
- Ajouter OpenAPI/Swagger pour documenter les endpoints.
- Ajouter Prisma ou Drizzle si le projet grandit.
- Ajouter un systeme de consentement patient.
- Ajouter une gestion multi-cliniques.
- Ajouter chiffrement applicatif de champs sensibles.

## 14. Conclusion

MediAI demontre une architecture complete de plateforme clinique moderne : frontend React, API Express securisee, PostgreSQL, Redis, JWT, logique IA isolee, Docker et CI. La solution reste volontairement pedagogique, mais elle pose les bases d'un systeme professionnel extensible.
