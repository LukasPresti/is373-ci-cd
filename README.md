# IS 373: Automated CI/CD Web Deployment

[![CI/CD Pipeline](https://github.com/LukasPresti/is373-ci-cd/actions/workflows/deploy.yml/badge.svg)](https://github.com/LukasPresti/is373-ci-cd/actions/workflows/deploy.yml)

## ?? Live Environments

- **Production Site:** [https://blandbred.org](https://blandbred.org)
- **QA Staging Site:** [https://dev.blandbred.org](https://dev.blandbred.org) *(also configured for [https://qa.blandbred.org](https://qa.blandbred.org))*

---

## ?? Project Overview

This repository implements an automated, end-to-end continuous integration and continuous deployment (CI/CD) pipeline for a containerized web application. Built for the **IS 373 Hosting & CI/CD** course project, this architecture deploys across isolated **QA** and **Production** environments hosted on an Ubuntu 24.04 LTS DigitalOcean Droplet behind a Traefik reverse proxy with automated Let's Encrypt SSL/TLS certificates.

### Key Architecture Components
- **Hosting Infrastructure:** DigitalOcean Droplet (`167.172.142.170`) running Ubuntu 24.04 LTS.
- **Reverse Proxy & TLS:** Traefik v3 routing traffic based on Host headers (`blandbred.org` and `dev.blandbred.org` / `qa.blandbred.org`) with automatic HTTP-to-HTTPS redirection and Let's Encrypt certificates.
- **Application Stack:** Containerized Node.js application running as a non-root user (`node`) exposing an interactive dashboard and `/health` verification endpoint.
- **Container Registry:** GitHub Packages / Container Registry (`ghcr.io/lukaspresti/is373-website`).
- **Automation Engine:** GitHub Actions for automated linting, test validation, multi-tag image builds, and automated SSH deployments.

---

## ?? Branching & Promotion Rules

The repository strictly enforces environment isolation between QA and Production:

1. **Development & QA Testing (`qa` branch):**
   - Developers push changes or feature branches to the `qa` branch.
   - GitHub Actions automatically runs the validation test suite (`npm test`).
   - If tests pass, a Docker image tagged `ghcr.io/lukaspresti/is373-website:qa` (and `sha-<commit>`) is published.
   - The workflow connects to the server and deploys the update to the QA container (`is373-qa`), immediately reachable at [https://dev.blandbred.org](https://dev.blandbred.org).
   - Production remains completely untouched.

2. **Production Release (`main` branch):**
   - Once changes are verified in QA, changes are promoted to `main`.
   - The workflow executes the full validation suite against `main`.
   - If tests pass, the release image is built and tagged `ghcr.io/lukaspresti/is373-website:latest` (and `sha-<commit>`).
   - The workflow deploys the container to the Production service (`is373-prod`), live at [https://blandbred.org](https://blandbred.org).

---

## ??? SSH Security & Server Hardening

Access to the DigitalOcean Droplet is restricted according to strict security guidelines:
- **Non-Root User:** A dedicated non-root administrative and deployment account (`deployer`) was created with sudo and docker group privileges.
- **SSH Key Authentication:** Dedicated ED25519 public key pairs are required for access; interactive password logins are permanently disabled.
- **Root Login Disabled:** Direct root SSH login is blocked at the SSH daemon configuration level (`PermitRootLogin no`).

### Redacted SSH Security Evidence

#### 1. Effective SSH Daemon Configuration (`/etc/ssh/sshd_config.d/99-hardened.conf`)
```text
$ ssh -i ~/.ssh/is373_deploy deployer@167.172.142.170 "sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication)'"
permitrootlogin no
passwordauthentication no
pubkeyauthentication yes
```

#### 2. Successful Non-Root SSH Login with Key
```text
$ ssh -i ~/.ssh/is373_deploy deployer@167.172.142.170 "whoami; hostname; id"
deployer
ubuntu-s-1vcpu-512mb-10gb-nyc1
uid=1000(deployer) gid=1000(deployer) groups=1000(deployer),27(sudo),100(users),987(docker)
```

#### 3. Root Login Rejected
```text
$ ssh -i ~/.ssh/is373_deploy root@167.172.142.170
root@167.172.142.170: Permission denied (publickey).
```

#### 4. Password Login Rejected
```text
$ ssh -o PubkeyAuthentication=no deployer@167.172.142.170
deployer@167.172.142.170: Permission denied (publickey).
```

---

## ?? CI/CD Pipeline & Test Evidence

### Pipeline Explanation
- **What triggers CI:** Pushes to `qa` branch trigger the QA deployment workflow; pushes or PR merges to `main` branch trigger the Production deployment workflow. Manual dispatch (`workflow_dispatch`) is also supported.
- **What it checks:** The `test` job runs `npm test` inside an isolated container runner. This validates that the Express server boots cleanly, the `/health` endpoint responds with HTTP 200 and valid JSON status, `/api/info` outputs deployment metadata, and HTML templates render appropriate environment badges. If any test fails, execution immediately halts and deployment is blocked.
- **How the image is built:** The `build-and-push` job uses Docker Buildx to build a minimal Alpine-based container (`node:20-alpine`) containing only production dependencies. The image is tagged with the target environment (`qa` or `latest`) and the exact commit SHA (`sha-<short_sha>`), and published to the GitHub Container Registry (`ghcr.io`).
- **How it reaches QA and Production:** The `deploy` job securely connects to the DigitalOcean Droplet via SSH using the `deployer` credentials stored in GitHub Secrets. It syncs `docker-compose.yml` and `deploy.sh`, authenticates to GHCR, pulls the newly built image, and updates the designated service (`web-qa` or `web-prod`) attached to the `hosting-web` Traefik network. Traefik automatically routes the traffic via HTTPS without interrupting other services.

### Deployment Evidence Links
- **GitHub Repository:** [https://github.com/LukasPresti/is373-ci-cd](https://github.com/LukasPresti/is373-ci-cd)
- **Container Registry Location:** [https://github.com/LukasPresti/is373-ci-cd/pkgs/container/is373-website](https://github.com/LukasPresti/is373-ci-cd/pkgs/container/is373-website)
- **Successful QA Workflow Run:** [Run #37821594403](https://github.com/LukasPresti/is373-ci-cd/actions/runs/37821594403)
- **Successful Production Workflow Run:** [Run #37822075817](https://github.com/LukasPresti/is373-ci-cd/actions/runs/37822075817)
- **Deployed Commit:** `d16bcad9601d83ac56f257ab720e78b65b3ad816`
- **Published Image Tags:** `ghcr.io/lukaspresti/is373-website:qa`, `ghcr.io/lukaspresti/is373-website:latest`, `ghcr.io/lukaspresti/is373-website:sha-d16bcad`

### Visible Change Demonstration (QA ? Production)
1. **Initial Deployment:** The initial release (commit `2801a3d`) was deployed to both environments.
2. **QA Change:** A visible feature update (commit `d16bcad`, bumping version to `v1.1.0` and adding the **"Visible Change Feature Release"** telemetry banner) was pushed to the `qa` branch.
   - [QA Workflow Run #37821594403](https://github.com/LukasPresti/is373-ci-cd/actions/runs/37821594403) completed successfully.
   - The QA site ([https://dev.blandbred.org](https://dev.blandbred.org)) immediately reflected the new banner and commit `d16bcad`.
   - Production ([https://blandbred.org](https://blandbred.org)) remained untouched on commit `2801a3d`.
3. **Production Promotion:** The changes were merged from `qa` into `main`.
   - [Production Workflow Run #37822075817](https://github.com/LukasPresti/is373-ci-cd/actions/runs/37822075817) completed successfully.
   - The Production site ([https://blandbred.org](https://blandbred.org)) updated to the promoted release showing the new feature banner and commit `d16bcad`.

---

## ?? Repository Contents
- `server.js` — Node.js Express web application and health check API.
- `package.json` — Application dependencies, versioning, and test scripts.
- `Dockerfile` — Multi-stage lightweight Alpine container definition.
- `docker-compose.yml` — Compose specification with Traefik routing rules and SSL definitions.
- `deploy.sh` — Remote deployment orchestration script executed by CI/CD.
- `.github/workflows/deploy.yml` — Automated CI/CD pipeline workflow.
- `tests/app.test.js` — Automated validation test suite.
