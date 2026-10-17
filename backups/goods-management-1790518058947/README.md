# Songam Restaurant � React + Node.js + MySQL

Requires Node.js 24.13.0 and MySQL 8.0 or later. This version implements sign-in and manager-only user CRUD, user-change logs, and enforced role permissions. Other management modules remain empty starting pages.

## 1. Install dependencies
Open a terminal in this folder (where package.json is located):

```powershell
node -v
npm.cmd install --include=dev
```

Installation must finish successfully. Use npm.cmd in PowerShell to avoid its npm.ps1 execution-policy error. npm install generates the lockfile. A verified lockfile could not be generated here because network access for the new MySQL dependency was unavailable.

## 2. Prepare MySQL
In MySQL Workbench or the MySQL CLI, using a database administrator account:

```sql
CREATE DATABASE songam_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'songam'@'127.0.0.1' IDENTIFIED BY 'choose-your-own-database-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES ON songam_restaurant.* TO 'songam'@'127.0.0.1';
```

If the database/account already exists, reuse it and its password instead of recreating it.

Copy .env.example to .env:

```powershell
Copy-Item .env.example .env
```

Edit .env. Set DB_PASSWORD to your actual database password. Set MANAGER_NAME, MANAGER_EMAIL, MANAGER_BIRTHDAY, and a unique MANAGER_PASSWORD of 12�128 characters. Quote values containing # or spaces. The manager birthday must be YYYY-MM-DD.

Create the initial manager and tables:

```powershell
npm.cmd run setup:manager
```

This setup works only when the user table is empty. Remove MANAGER_PASSWORD from .env after success. Do not share or commit .env.

## 3. Run the project

```powershell
npm.cmd start
```

This starts the Node backend first, then the React frontend when the backend is ready. Open http://127.0.0.1:5173 and sign in with the manager account created during setup. Keep the terminal running. Ctrl+C stops both servers.

If .env or the MySQL driver is missing, startup prints the required setup action. If MySQL is unavailable, fix the connection error printed in the terminal. The frontend now handles empty or non-JSON server errors without crashing the login flow.

For separate debugging terminals only: npm.cmd run backend and npm.cmd run frontend.

## User management
Only managers can view user lists/logs and create, edit, or delete accounts. Fields: name, email, password, job, birthday, calculated age, and job-derived ability. A blank password during editing keeps the current password; changing a password or job revokes existing sessions. Passwords are hashed with salted scrypt and never returned by the API. Email addresses must be unique. Managers cannot delete or demote their own account; at least one manager must remain. User changes are recorded in the latest-200-entry user log.

| Job | Ability |
| --- | --- |
| manager | All five management pages |
| cooker | Material management and Food management |
| servicer | Export management |
| guider | Export management |
| worker | No management pages |

Ability is enforced by the backend, not editable free text. Workers can sign in and see their account status, but cannot access management APIs. Imports are manager-only. Sessions expire after eight hours. Login attempts are rate-limited per connection IP.

## Checks
```powershell
npm.cmd test
npm.cmd run build
```

The frontend build and six tests passed on Node.js 24.13.0. Live MySQL CRUD, setup, and login have not been integration-tested in this environment: the MySQL driver download was blocked and no configured database was available. Install and configure MySQL as above before running.

`npm.cmd run preview` previews built assets only; use the development command above for the connected application. Production hosting needs an HTTPS reverse proxy serving dist/ and forwarding /api to the Node server, APP_ORIGINS set to its exact origin, and COOKIE_SECURE=true.

## Source
- src/App.jsx: login and role-aware navigation
- src/UserManagement.jsx: user forms, list, and logs
- src/api.js: API client
- server/index.mjs: HTTP API, sessions, permission checks, transactional user changes
- server/domain.mjs: validation, ages, roles, password hashing
- server/db.mjs: MySQL tables and connection
- server/setup.mjs: initial manager setup
- tests/domain.test.mjs: domain checks


## Material management
- Material Category: create, rename, and delete categories (for example Meat).
- Material Lists: create/edit/delete materials (for example Beef), assign a category, select kg/g/L/ml/piece, and set cost per unit with up to three decimal places.
- Material Statistics: select day, month, or year and a date within that period; optionally filter by material. Record dated usage quantities and view quantity totals per material plus total usage cost. Usage dates are calendar dates; future records are rejected.
- Each usage entry snapshots the material's current unit cost when recorded. Later price edits do not recalculate old usage. Historical entries use that saved price even if the entered usage date is earlier. Delete an incorrect usage entry and record it again to correct it.
- A material's unit cannot change after usage is recorded. Categories in use and materials with usage history cannot be deleted.
- Costs currently have no currency symbol. Use one consistent currency for all material costs.
- Usage is recorded manually until food recipes/production are implemented. No automatic food deduction or stock balance is implied.
- All material APIs require the user's assigned Material management ability. New database tables are created at backend startup using the existing CREATE permission.

Verification for this update: production frontend build and nine automated tests passed. Live MySQL integration was attempted but blocked by ER_DBACCESS_DENIED_ERROR for the configured songam account. Restore that account's database grants with npm.cmd run db:repair before starting if this error persists.


Material costs support Dollar (USD) and Won (KRW). Choose a material type and currency when adding a material. Existing costs and usage are migrated as USD. Usage records retain the currency and cost from the time of recording, and statistics total each currency separately without exchange-rate conversion. Restart the backend after updating to apply the automatic currency-column migration.


Food management supports recipes for one serving, with a quantity and compatible unit for each material, plus a selling price in USD or KRW. Ingredient costs use current material prices, automatically converting kg/g and L/ml. Mixed currencies appear as separate totals without exchange-rate conversion. Saving a recipe does not record material usage. Materials referenced by recipes cannot be deleted or have their pricing unit changed. Food access follows the existing food management ability.

Food recipe ingredients are selected by material category. Import management has Material Import and Goods Import pages. Material Import saves up to 50 lines atomically with date, material, weight/quantity, compatible unit, total purchase cost and USD/KRW currency. Costs are line totals, not unit prices. History preserves material names and costs and shows the latest 100 imports. Import entry does not change recipe prices or implement inventory balances.

Goods Import records multiple goods with name, quantity, total cost and currency, together on one import date. It has its own history, separate from materials.
