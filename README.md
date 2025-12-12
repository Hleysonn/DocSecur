# SecureDocs

Application fullstack pour la gestion sécurisée de documents.

## Démarrage rapide

### Backend
1. `cd Backend`
2. `pnpm install`
3. Copiez `.env.example` vers `.env` (variables : `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CRYPTO_KEY`, `CLIENT_ORIGIN`, `PORT`)
4. `pnpm dev`

Endpoints principaux : `/auth`, `/documents`, `/admin`, `/health`.

### Frontend
1. `cd docSecure`
2. `pnpm install`
3. Ajoutez `VITE_API_URL` dans un fichier `.env.local` (par ex. `http://localhost:4000`)
4. `pnpm dev`

## Fonctionnalités 
- Backend Express + Mongoose : auth JWT access/refresh, sessions persistées, hashing Argon2id, chiffrement AES-256-GCM, rôles USER/MANAGER/ADMIN, routes documents (CRUD simple + partage + version), admin (users + logs).
- Front React + Vite + Tailwind : routing protégé, context d’auth, pages Login/Dashboard/Documents/Admin, navigation et placeholders fonctionnels.

## Sécurité
- Hash Argon2id pour mots de passe
- AES-256-GCM (clé hex 32 octets) pour données sensibles
- JWT access (15m) + refresh (7j) avec rotation stockée en base
- Rate limiting sur `/auth`


## Test MFA avec Authenticator/par mail

- améliorer les cors
- blacklister les tokens
- User et le manag ne devraient pas voir les logs
- Manag ne supprime que ses upload mais pas celui de l'user
- Admin voit tous et peut tous supprimer
