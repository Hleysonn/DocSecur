# SecureDocs

Application fullstack pour la gestion sécurisée de documents.

## Démarrage rapide

### Backend

1. `cd Backend`
2. `pnpm install`
3. Copiez `.env.example` vers `.env`
4. Renseignez obligatoirement :
   - `MONGO_URI`
   - `JWT_ACCESS_SECRET` (32+ chars)
   - `JWT_REFRESH_SECRET` (32+ chars)
   - `CRYPTO_KEY` (clé hex 64 chars, 32 octets)
   - `CLIENT_ORIGIN` (origines autorisées, séparées par virgule, ex : `http://localhost:XXXX)
   - `PORT` (par défaut 4000)
5. `pnpm dev`

Endpoints principaux : `/auth`, `/documents`, `/admin`, `/health`, `/stats`.

### Frontend

1. `cd docSecure`
2. `pnpm install`
3. Ajoutez `VITE_API_URL` dans un fichier `.env.local` (par ex. `http://localhost:XXXX`)
4. `pnpm dev`

### Client HTTP & rafraîchissement

- Client API intercepte les 401, appelle `/auth/refresh` puis rejoue la requête avec le nouveau token.
- Hook `useApi` : enveloppe les appels et déclenche un logout si le refresh échoue (nettoyage local).
- Refresh token en cookie httpOnly/sameSite, access token en mémoire front.
- Message UX en cas de session expirée : le client affiche "Session expirée, reconnectez-vous." et force la déconnexion si le refresh échoue.

### Tests backend

- Tests d’intégration (Vitest + Supertest + Mongo en mémoire) : `cd Backend && pnpm test`
- Couvre notamment :
  - Accès : un USER ne peut pas atteindre les routes admin, un MANAGER ne peut pas supprimer les documents d’autrui.
  - Validation/erreurs : auth (register email invalide, login invalide), documents (401 sans auth, 400 corps invalide), admin (403 si USER), stats (401 sans auth).

## Fonctionnalités

- Backend Express + Mongoose : auth JWT access/refresh, sessions persistées, hashing Argon2id, chiffrement AES-256-GCM, rôles USER/MANAGER/ADMIN, routes documents (CRUD simple + partage + version), admin (users + logs).
- Front React + Vite + Tailwind : routing protégé, context d’auth, pages Login/Dashboard/Documents/Admin, navigation et placeholders fonctionnels.

### Sécurité & flux de tokens (mis à jour)

- CORS strict : `CLIENT_ORIGIN` est obligatoire (peut contenir plusieurs origines séparées par des virgules).
- Refresh token en cookie httpOnly/sameSite (secure en prod), path `/auth`, rotation à chaque `/auth/refresh`.
- Access token en mémoire/front, rafraîchissement automatique via intercept 401 côté client.
- Logout : supprime la session refresh, efface le cookie, et blackliste l’access token courant (envoyer l’Authorization Bearer sur `/auth/logout`). La blocklist est vérifiée sur chaque requête authentifiée (TTL aligné sur l’exp du token).
- CSRF : middleware `csurf` avec cookie sameSite=lax ; récupérer un token via `GET /auth/csrf` et l’envoyer dans le header `X-CSRF-Token` pour les requêtes mutantes (POST/PUT/PATCH/DELETE). Erreur retournée : 403 CSRF token invalide.
- Headers sécurisés : `helmet` activé (HSTS, noSniff, hide-powered-by, frameguard, etc.).
- Limitation de débit supplémentaire sur les uploads (30 req / 15 min) et téléchargements (60 req / min) de documents.
- Changement de mot de passe : purge toutes les sessions de l’utilisateur et révoque le token d’accès courant (reconnexion requise).
- Sanitization XSS : middleware backend qui nettoie body/query/params (strip `<script>` + échappement), et sanitation côté front des messages d’erreur affichés.
- Journaux : logService tronque et whiteliste les champs (action/resource/ip/userAgent) pour éviter toute fuite de données sensibles.
- Téléchargement binaire : endpoint `GET /documents/:id/file` (Content-Disposition) pour éviter le base64 JSON et réduire l’empreinte mémoire.
- Front : déconnexion automatique après 3 min d’inactivité (events user + tab), avec refresh automatique des tokens avant expiration.
- Documents : ADMIN voit et peut supprimer tous les documents non supprimés ; MANAGER voit ses docs + ceux des USER mais ne supprime rien ; USER voit ses docs/partages mais ne peut pas supprimer.

## Sécurité

- Hash Argon2id pour mots de passe
- AES-256-GCM (clé hex 32 octets) pour données sensibles
- JWT access (15m) + refresh (7j) avec rotation stockée en base
- Rate limiting sur `/auth`

## Test MFA avec Authenticator/par mail voir avec google mais pas envi

- User et le manag ne devraient pas voir les logs
- Manag ne supprime que ses upload mais pas celui de l'user
- Admin voit tous et peut tous supprimer
