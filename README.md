# CBE Leave Utilization — Weekly / Monthly / Annual Leave Web App

A web app for **NHQ Building & Property Management Division, Commercial Bank of Ethiopia**, built from your
uploaded Google Form ("Weekly Leave Utilization Submission") and Excel reports. It replaces the form + spreadsheet
workflow with one system that:

- Team leaders **submit weekly leave** for employees under them (same fields as your Google Form). Reporting
  weeks run **Friday → Thursday**, matching HRBP's official template, which is sent every Friday.
- If the same employee has more than one leave period in the same reporting week, the weekly report **merges
  them into one block** (ID/Name/Sector/Department/Position shown once, days summed into one Total) — both
  on-screen and in the exported Excel file.
- **Admins can import leave from an Excel file** for anything not submitted through the team-leader form — it's
  matched against the roster and added straight into the system, showing up in reports and balances immediately.
- If the same employee has more than one leave period in the same reporting week, the weekly report **merges
  them into one block** (ID/Name/Sector/Department/Position shown once, days summed into one Total) — both
  on-screen and in the exported Excel file.
- **Duplicate leave entries are blocked automatically** — same employee, same dates, same day count won't be
  recorded twice, whether submitted by a team leader, imported from Excel, or already sitting in the database
  (Admin → Import Leave has a one-click cleanup for anything duplicated before this check existed).
- Both the weekly and monthly reports **export as fully-styled Excel files** — same fonts, gold header, and
  shaded columns as your original HRBP template, not a plain CSV.
- Weekly reports **roll up into a monthly report** automatically — no manual copy-paste.
- The app tracks each employee's **leave balance directly from HR's export**: net leave accrual to date, and
  what portion of it will **expire on December 31** if unused (Ethiopian annual leave has no carry-over) —
  automatically reduced further by any leave submitted through the app since that export.
- Four roles: **Admin**, **Manager** (read-only oversight), **Team Leader** (submits weekly leave), **Employee**
  (views their own leave & balance).
- Visual style adapted from CBE's brand: deep purple + gold, serif display type for headings, clean data tables.

## Where everything lives

| Concern | Service | Cost |
|---|---|---|
| Sign-in (email/password) | **Firebase Authentication** | Free (Spark plan) |
| Database (employees, leave entries, user roles) | **Supabase** (hosted Postgres) | Free tier |
| API that connects the two, hosting, and your domain | **Cloudflare Pages** (site + Functions) | Free tier |
| Source control | **GitHub** | Free |

**Why this shape, not Firestore directly:** the browser never talks to the database. It signs in with Firebase,
then calls a small API (`/functions/api/*`, running on Cloudflare) which checks the Firebase sign-in is valid and
*then* reads/writes Supabase using a secret key that only lives on Cloudflare's servers — never in the browser.
This is what makes Supabase's free tier safe to use here (its keys are never public), and it means you're not
tied to Firestore's pricing at all.

---

## 1. What's inside

```
src/
  firebase.js               Firebase init — Authentication only
  context/AuthContext.jsx   Sign-in/out + loads the caller's role via the API
  services/apiClient.js     Attaches the Firebase sign-in token to every API call
  services/db.js            Calls /api/employees, /api/users, /api/leave-entries
  utils/dateWeek.js         Monday–Saturday "reporting week" helpers
  utils/leaveEngine.js      Weekly report, monthly report, annual balance calculations
  data/seedEmployees.js     Starter roster pulled from your uploaded files (one-click load)
  pages/                    Login, Overview, TeamLeaderSubmit, WeeklyReport, MonthlyReport,
                             Balances, EmployeeSelf, AdminEmployees, AdminUsers, PendingApproval
  components/               Shell (sidebar/topbar), StatCard, Badge, EmptyState

functions/
  api/employees.js          List / add / edit / remove employees
  api/users.js               Get-or-create your own profile; admin: list + assign roles
  api/leave-entries.js      List / submit / remove weekly leave entries
  _lib/firebaseAuth.js      Verifies the caller's Firebase sign-in token
  _lib/supabase.js          Talks to Supabase using the secret service-role key
  _lib/authz.js             Looks up the caller's role to decide what they're allowed to do

supabase/
  schema.sql                Run once in Supabase's SQL editor to create the tables

.env.example                All the config keys you'll need, explained
```

## 2. Roles at a glance

| Role | Can do |
|---|---|
| **Admin** | Add/edit/remove employees, set annual entitlements, approve new accounts and assign roles, **create accounts directly with a chosen email/password/role**, **import leave from an Excel file**, view every report |
| **Manager** | Read-only: weekly report, monthly report, annual balances, overview dashboard |
| **Team Leader** | Submit weekly leave for their team; view the reports for what they've submitted |
| **Employee** | View their own leave history and annual balance only |

New sign-ups start as **Pending** with no access until an Admin approves them from **Admin → Users & Roles**.
Admins can also skip that step entirely and **create an account directly** from the same screen — pick an
email, a password, and a role up front, then share the credentials with that person so they can sign in right
away. Both paths work side by side: self-signup (pending → approved) and admin-created (ready immediately).

---

## 3. Go live — do this in order

### Step 1 — Get the code onto GitHub (no commands, all clicking)
1. Unzip the project folder on your PC.
2. On **github.com**, click **+ → New repository**, name it (e.g. `cbe-leave-utilization`), and **Create repository** — don't tick any of the "add README" boxes.
3. On the empty repo page, click **uploading an existing file**.
4. Open the extracted folder and select **everything inside it** (`src`, `public`, `functions`, `supabase`, `package.json`, `README.md`, etc. — not the folder itself) and drag that selection into the browser.
5. Scroll down, click **Commit changes**.

Any future change: open the file on GitHub, click the pencil (✎) icon, edit, **Commit changes** — Cloudflare redeploys automatically.

### Step 2 — Create the Supabase database (free)
1. Go to **supabase.com** → **Start your project** → sign in → **New project**.
2. Name it (e.g. `cbe-leave-utilization`), set a database password (save it somewhere), pick a region, click **Create new project** (takes ~2 minutes to provision).
3. Once it's ready, open the **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase/schema.sql` from the project (on GitHub, click the file → the raw contents are shown), copy all of it, paste into the SQL editor, and click **Run**. This creates the `app_users`, `employees`, and `leave_entries` tables.
5. Go to **Project Settings → API**. You'll need two things from this page in Step 4:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role** secret key (under "Project API keys" — click to reveal it). Keep this one private; never put it in the frontend.

### Step 3 — Create the Firebase project (Authentication only)
1. Go to **console.firebase.google.com** → **Add project** → name it → **Create project**.
2. Click the **`</>`** (Web) icon → nickname it → **Register app**. Copy the config values shown (`apiKey`, `authDomain`, `projectId`, `appId`) — you'll need them in Step 4.
3. **Build → Authentication → Get started → Sign-in method** → enable **Email/Password**.

*(You do not need to create a Firestore database at all — this app doesn't use one.)*

### Step 4 — Deploy on Cloudflare Pages
1. **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**, authorize GitHub, pick your repo.
2. Build settings:
   | Setting | Value |
   |---|---|
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
3. Before clicking deploy (or right after, under **Settings → Environment variables**), add these — **for both Production and Preview**:

   | Variable | Value | Where it's used |
   |---|---|---|
   | `VITE_FIREBASE_API_KEY` | from Step 3.2 | Browser (sign-in) |
   | `VITE_FIREBASE_AUTH_DOMAIN` | from Step 3.2 | Browser (sign-in) |
   | `VITE_FIREBASE_PROJECT_ID` | from Step 3.2 | Browser (sign-in) |
   | `VITE_FIREBASE_APP_ID` | from Step 3.2 | Browser (sign-in) |
   | `FIREBASE_PROJECT_ID` | same value as above, no `VITE_` prefix | Cloudflare Function (verifies sign-in) |
   | `SUPABASE_URL` | from Step 2.5 | Cloudflare Function (database) |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Step 2.5 | Cloudflare Function (database) — keep secret |

4. Click **Save and Deploy**. You'll get a working `https://cbe-leave-utilization.pages.dev` link in a minute or two.

`public/_redirects` is already included so page refreshes/direct links don't 404, and the `functions/api/*` files are picked up and deployed automatically as serverless Functions alongside the site — nothing extra to configure.

### Step 5 — Point your domain at it
1. If your domain isn't already on Cloudflare: **Add a site**, free plan, update your registrar's nameservers to the two Cloudflare gives you.
2. Once **Active**, go to your Pages project → **Custom domains → Set up a custom domain**, enter e.g. `leave.combanketh.et`. Cloudflare handles SSL and DNS automatically.

### Step 6 — Tell Firebase to trust your domain
1. Firebase Console → **Authentication → Settings → Authorized domains → Add domain**.
2. Add your real domain and the `*.pages.dev` one.

### Step 7 — Create your first Admin
Every new sign-up starts with no access, so bootstrap the first one by hand:
1. Open your live site, **create an account** from the sign-in screen. You'll land on "Awaiting approval" — expected.
2. In Supabase: **Table Editor → app_users**, find the row with your email.
3. Change its `role` cell from `pending` to `admin` → save.
4. Reload your site — you're in as Admin.
5. From **Admin → Users & Roles**, approve everyone else. From **Admin → Employees**, click **Load starter roster** or add employees, and set each one's real annual leave entitlement (from HR).

---

## 4. If something doesn't work

| Symptom | Likely cause |
|---|---|
| Sign-in fails / spins forever on your custom domain | Domain missing from Firebase's **Authorized domains** (Step 6) |
| "Firebase isn't configured" banner | A `VITE_FIREBASE_*` variable is missing/misspelled in Cloudflare, or the site needs a fresh deploy after adding them |
| API calls fail with a 500 / "Server misconfigured" | `FIREBASE_PROJECT_ID`, `SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` missing/misspelled in Cloudflare's environment variables |
| API calls fail with 401 "Invalid or expired token" | The signed-in user's session expired — sign out and back in |
| New sign-ups stuck on "Awaiting approval" forever | Expected — an Admin must assign their role (Step 7.5) |
| Page blank / 404 on refresh at a route like `/weekly` | `public/_redirects` missing from the deployed build — confirm it exists in the repo |

---

## 5. How the numbers are calculated

- **Weekly report** — groups all leave entries whose reporting week (Monday of that week) matches the selected week, in your Excel's columns: S.N, ID, Name, Sector/Division, Department/Unit, Position, # Days, Start, End, Total.
- **Monthly report** — sums every entry submitted for a calendar month/employee. Because team leaders split leave that spans a reporting-week boundary (same as your original form's instructions), each entry already belongs cleanly to one month.
- **Leave balance**, per employee, per year — driven by HR's own export rather than a generic entitlement formula:
  - **Net accrual (HR)** — total unused leave accrued as of HR's export, entered per employee under Admin → Employees (or bulk-loaded from `src/data/seedEmployees.js`).
  - **Expiring Dec 31 (HR)** — the portion of that accrual that is **lost if unused by December 31** (no carry-over). The rest of the net accrual is safe and carries forward regardless of December.
  - **Taken via app** — leave submitted through this app for that year, treated as happening *after* HR's export. It's applied against the expiring bucket first (since that's the leave most at risk), then against the rest of the balance.
  - **Remaining** = Net accrual − Taken via app.
  - **Net balance** = Remaining while the year is still open; after December 31, only the *expiring* bucket is actually lost, so net balance = Remaining − whatever was still expiring.
  - Re-import updated HR balances any time from **Admin → Employees**; day-to-day leave doesn't require manual balance edits.
  - Adjust `computeAnnualBalance()` in `src/utils/leaveEngine.js` if HR's carry-over policy changes.

---

## 6. Extending it further

- **Email notifications** on submission or expiry risk — add a Cloudflare Function that calls an email API (e.g. Resend, SendGrid) after a leave entry is created.
- **Oracle CSV import** — add an importer on the Admin screen to pull approved leave directly instead of manual entry.
- **Multi-division support** — add a `division` filter so the same app can serve other divisions, each with its own Managers/Team Leaders.
- **Audit trail** — `leave_entries.submitted_at` / `submitted_by_name` are already stored; a full history view per employee is a small addition.

---

## 7. Brand notes

The color palette (deep brown `#3E1C11` / bronze `#815630` / gold `#D0A12A`) is extracted directly from your
uploaded CBE logo (`public/cbe-logo.svg`), not a guess — it's used across the login page, sidebar, buttons, and
report tables. If you get an updated logo file, replace `public/cbe-logo.svg` (same filename), and update the hex
values in `tailwind.config.js` (`theme.extend.colors.cbe`) to match if the palette changes.

Two employees from HR's balance export (`70595 — Bitew Bikale Woldetsadik` and `55950 — Yemisrach Teklu Abebe`)
weren't in the original roster form, so they've been added with placeholder positions/departments — update those
from **Admin → Employees** once you know their actual role.
