# How to change the login account / password

There is **one** login account. You change it by editing config and rebuilding.

## 1. Edit the `.env` file

In the **project root** (same folder as `package.json`), create or edit the file **`.env`**:

```env
VITE_LOGIN_USERNAME=your_username
VITE_LOGIN_PASSWORD=your_new_password
```

- **VITE_LOGIN_USERNAME** – the only username that can log in (no @ required; e.g. `admin` or `CICTMO`). You can still use **VITE_LOGIN_EMAIL** instead if you prefer.
- **VITE_LOGIN_PASSWORD** – the password for that account.

Save the file.

## 2. Rebuild and restart

From the project root run:

```bash
npm run build
npm start
```

Or just `npm start` (it runs the frontend build too). Then open the app and log in with the new username and password.

---

## Where this is used in the code

- **File:** `src/AuthContext.tsx`  
- **Function:** `validateCredentials` (near the bottom)  
- It reads `import.meta.env.VITE_LOGIN_USERNAME` (or `VITE_LOGIN_EMAIL`) and `import.meta.env.VITE_LOGIN_PASSWORD`.  
- Those values come from your **`.env`** file when you run `npm run build`.

So: **to change the account or password, edit `.env` and run `npm run build` then `npm start`.**
