# Git Setup Instructions

## IMPORTANT: Do this BEFORE running `git init`

1. **Regenerate your OpenAI API key** (the current one was exposed):
   - Go to https://platform.openai.com/api-keys
   - Delete your current key
   - Create a new one
   - Update `server/.env` with the new key

2. **Verify .gitignore is in place**:
   ```bash
   cat .gitignore
   ```
   Should include `.env` (it already does!)

3. **Initialize git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Double-check .env is NOT tracked**:
   ```bash
   git status
   ```
   Should NOT show `server/.env`

## What's Already Protected

The `.gitignore` file already includes:
- `.env` files (your API keys)
- `node_modules/` (dependencies)
- Build outputs
- Editor configs
- OS files

## If You Accidentally Commit .env

If you ever accidentally commit the .env file:

1. Remove it from git tracking:
   ```bash
   git rm --cached server/.env
   git commit -m "Remove .env from tracking"
   ```

2. Regenerate your API key immediately

3. Never force push to rewrite history unless you know what you're doing
