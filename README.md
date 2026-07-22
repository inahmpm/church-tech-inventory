# COG Dasma Inventory

Equipment inventory + borrower workflow, built with React (Vite) + Firebase.

## What's included

- **Public borrower form** at `/borrow` — anyone with the link can submit a request
  (Name, Email, Ministry, Contact No., Venue, Equipment to borrow). Submission time is
  stamped automatically.
- **Email notifications** (via the Firebase "Trigger Email" extension):
  - New request submitted → email to the tech office.
  - Request finalized (items handed out) → email to the borrower.
  - Items returned → email to the borrower.
- **Admin app** at `/admin` (requires sign-in):
  - **Dashboard** — totals, breakdown by status/category, currently borrowed count, latest
    pending requests.
  - **Inventory** — full CRUD table with the exact columns requested (Category, Inventory
    Code, Items, Assigned to, Purchase Date, Status dropdown, Status Details), plus a
    barcode generator/printer for each item's Inventory Code.
  - **Borrow Requests** — list of submitted requests; open one to scan barcodes (camera or
    USB/Bluetooth scanner) to attach equipment, then finalize the hand-out. Multiple items
    can be attached per request.
  - **Active Borrows** — items currently out; "Item/s Returned" marks everything in that
    request back to available in one click.

## One-time setup

1. **Create a Firebase project** at https://console.firebase.google.com.
2. Enable **Firestore** (production mode) and **Authentication → Email/Password**.
3. Create at least one admin user under Authentication → Users (this is who tech support
   signs in as at `/admin/login`).
4. In Project Settings → General, add a **Web app** and copy its config values into
   `.env.local` (copy `.env.example` first):
   ```
   cp .env.example .env.local
   ```
5. Deploy the security rules and indexes (requires the Firebase CLI: `npm i -g firebase-tools`):
   ```
   firebase login
   firebase use --add        # select your project
   firebase deploy --only firestore
   ```
6. **Set up email notifications** — the app queues emails by writing to a `mail`
   Firestore collection; the "Trigger Email" extension watches that collection and
   sends via SMTP. This requires the **Blaze (pay-as-you-go)** plan (the extension
   itself has no charge at this volume, but extensions require Blaze to install):
   - In the Firebase console, upgrade the project to Blaze.
   - Go to **Extensions → Install extension**, search for **"Trigger Email"**
     (`firebase/firestore-send-email`), and install it.
   - During setup, set:
     - **SMTP connection URI** — from your email provider (e.g. a Gmail account with
       an [app password](https://myaccount.google.com/apppasswords), or a
       transactional provider like Resend/SendGrid's SMTP credentials).
     - **Default FROM address** — who the emails appear to come from.
     - **Mail collection** — leave as the default `mail`.
   - The tech-office notification address is hardcoded in
     [`src/lib/borrowRequests.ts`](src/lib/borrowRequests.ts) as `ADMIN_EMAIL`
     (currently `cogtech.dasma@gmail.com`) — update it there if it changes.

## Run locally

```
npm install
npm run dev
```

- Borrower form: http://localhost:5173/borrow
- Admin: http://localhost:5173/admin/login

## Deploy

```
npm run build
firebase deploy --only hosting
```

## Notes on the data model

- The visible **Status** dropdown (Good/Fair Condition, For Repair, For Replacement, For
  Disposal) is the equipment's *condition*, independent from whether it's currently lent
  out. Borrow/return state is tracked separately (`isBorrowed` / `activeBorrowRequestId`)
  so an item can be "Good Condition" and "Borrowed" at the same time.
- **Assigned to** is the person/ministry an item is permanently assigned to (e.g. a laptop
  kept by media team), not the current borrower — that comes from the linked borrow
  request.
- Each equipment's **Inventory Code** doubles as its barcode value (CODE128), printable
  from the Inventory page.
