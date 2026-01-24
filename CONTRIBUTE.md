# 🧩 Contributing to WatchDen

## 📌 Project Workflow

- Work only on the `dev` branch or a feature branch based off `dev`.
- Never commit directly to `main`.
- All feature additions or fixes should be done in feature branches like:

### Clone the Repo (first time only)

```bash
git clone https://github.com/SarkarSubhajit/WatchDen.git
cd WatchDen
```

### Create and Switch to a New Feature Branch
Replace feature-name with what you’re working on, like feature/login.
```bash
git checkout -b feature/< feature-name >
```
If existing branch then
```bash
git checkout feature/< feature-name >
```

### Make Code Changes

Add or edit files in the frontend or backend folders.

### Stage and Commit Your Changes

```bash
git add .
git commit -m "feat: < add login page layout >"
```

### Pull Latest Dev Before Push (to avoid conflict)

```bash
git pull origin dev
```

### Push to Remote

```bash
git push origin feature/< feature-name >
```

### Create Pull Request (PR)

- Go to your repo on GitHub.
- Click “Compare & pull request”.

- Set:
  base branch = dev
  compare branch = feature/feature-name

- Add a clear title & description.
- Submit the PR.

### After PR is Merged

- Delete your branch (GitHub gives you the option), then:

```bash
git checkout dev
git pull origin dev
```

- Then you can start a new feature branch:

```bash
git checkout -b feature/< new-task >
```

### Optional: Check Status & Log

- See what’s changed:

```bash
git status
```

- View commit history:

```bash
git log --oneline
```
