# Find My Desk Hackathon — Starting Template

Welcome to the starting template for Hackathon 1. This repo contains everything you need to get your team up and running.

## Getting Started

**Fork this repository** and rename it to your team name. That will be your team's working repo for the duration of the hackathon.

See [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md) for installation instructions.

---

## Helpful Docs

We're building with **Claude Code** — Anthropic's AI coding assistant.

- [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [Choosing a Model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)

### Prompting Claude

- [Prompting Guidelines](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)

### Tokens and Limits

Tokens are the units the API uses to measure text — roughly 1 token per ~4 characters of English. Every request and response costs tokens, so prompt length, context window size, and response verbosity all add up quickly. To stay within budget: keep system prompts lean, truncate or summarize long conversation histories rather than passing them wholesale, and set `max_tokens` to the minimum needed for each call.

- [Model Costs](https://platform.claude.com/docs/en/about-claude/pricing)

---

## Provided Data

Some dummy data has been provided to help foster ideas or assist in your solution design. The data contains two office floorplans and an employee directory. **You are not required to use any of it**, and using or ignoring it will not affect scoring. You are free to mutate the data in any way you wish.

### Floorplans

Office layout images are in the `floorplans/` directory: `ground.png` and `first.png`.

### Employee Directory

The app stores employee directory records in `data/users.db` and desk records in `data/desks.db`.

---

## Azure OIDC SSO (Developer Setup)

This template includes a runnable web auth flow with Azure OIDC.

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment variables

Copy `.env.example` values into your environment (or `.env` loader if you use one):

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_REDIRECT_URI`
- `FLASK_SECRET_KEY`
- `POST_LOGOUT_REDIRECT_URI`

### 3. Register redirect URI in Azure Entra

In App Registration -> Authentication -> Web, add:

- Local: `http://localhost:5000/auth/callback`
- Public site: `https://<your-domain>/auth/callback`

The value **must exactly match** `AZURE_REDIRECT_URI`.

### 4. Run app

```bash
python -m App.app
```

### 5. Endpoints

- `/` Home page with sign-in link
- `/auth/login` Starts Azure login
- `/auth/callback` OAuth callback endpoint
- `/auth/logout` Signs out locally and redirects to Azure logout
- `/api/me` Returns current user profile from session
