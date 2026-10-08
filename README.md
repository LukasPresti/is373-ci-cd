# IS 373: Automated CI/CD Web Deployment

[![CI/CD Pipeline](https://github.com/LukasPresti/is373-ci-cd/actions/workflows/deploy.yml/badge.svg)](https://github.com/LukasPresti/is373-ci-cd/actions/workflows/deploy.yml)

## ?? Live Environments

- **Production Site:** [https://blandbred.org](https://blandbred.org)
- **QA Staging Site:** [https://qa.blandbred.org](https://qa.blandbred.org) *(also accessible via [https://dev.blandbred.org](https://dev.blandbred.org))*

---

## ?? Project Overview

This repository implements an automated, end-to-end continuous integration and continuous deployment (CI/CD) pipeline for a containerized web application. Built for the **IS 373 Hosting & CI/CD** course project, this architecture deploys across separated **QA** and **Production** environments hosted on an Ubuntu 24.04 LTS DigitalOcean Droplet behind a Traefik reverse proxy with automated Let's Encrypt SSL/TLS certificates.

### Key Architecture Components
- **Hosting Infrastructure:** DigitalOcean Droplet (`167.172.142.170`) running Ubuntu 24.04 LTS.
- **Reverse Proxy & TLS:** Traefik v3 routing traffic based on Host headers (`blandbred.org` and `qa.blandbred.org`) with automatic HTTP-to-HTTPS redirection and Let's Encrypt certificates.
- **Application Stack:** Containerized Node.js application running as a non-root user (`node`) exposing a dashboard and `/health` verification endpoint.
- **Container Registry:** GitHub Packages / Container Registry (`ghcr.io/lukaspresti/is373-website`).
- **Automation Engine:** GitHub Actions for automated linting, test validation, multi-tag image builds, and zero-downtime SSH deployments.

---

## ?? Branching & Promotion Rules

The repository strictly enforces environment isolation between QA and Production:

1. **Development & QA Testing (`qa` branch):**
   - Developers push changes or feature branches to the `qa` branch.
   - GitHub Actions automatically runs the validation test suite (`npm test`).
   - If tests pass, a Docker image tagged `ghcr.io/lukaspresti/is373-website:qa` (and `sha-<commit>`) is published.
   - The workflow connects to the server and deploys the update to the QA container (`is373-qa`), immediately reachable at [https://qa.blandbred.org](https://qa.blandbred.org).
   - Production remains untouched.

2. **Production Release (`main` branch):**
   - Once changes are verified in QA, a Pull Request is opened and merged into `main`.
   - The workflow executes the full validation suite against `main`.
   - If tests pass, the release image is built and tagged `ghcr.io/lukaspresti/is373-website:latest` (and `sha-<commit>`).
   - The workflow deploys the container to the Production service (`is373-prod`), live at [https://blandbred.org](https://blandbred.org).

---

## ??? SSH Security & Server Hardening

Access to the DigitalOcean Droplet is restricted according to strict security guidelines:
- **Non-Root User:** A dedicated non-root administrative and deployment account (`deployer`) was created with sudo and docker group privileges.
- **SSH Key Authentication:** Dedicated ED25519 public key pairs are required for access; interactive password logins are permanently disabled.
- **Root Login Disabled:** Direct root SSH login is blocked at the SSH daemon configuration level.

### Redacted SSH Security Evidence

#### 1. Effective SSH Daemon Configuration (`/etc/ssh/sshd_config.d/99-hardened.conf`)
```text
$ sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication)'
permitrootlogin no
passwordauthentication no
pubkeyauthentication yes
```

#### 2. Successful Non-Root SSH Login with Key
```text
$ ssh -i ~/.ssh/is373_deploy deployer@167.172.142.170 "whoami; hostname; groups"
deployer
ubuntu-s-1vcpu-2gb-nyc1-01
deployer sudo docker
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

### Pipeline Workflow Walkthrough
- **Trigger:** Pushes to `qa` or `main` branches, plus manual dispatch.
- **Validation Stage (`test` job):** Runs `npm test` verifying that the application boots cleanly, `/health` returns HTTP 200 with JSON payload, and the correct environment variables are rendered. A failure halts the pipeline before image generation.
- **Build & Publish Stage (`build-and-push` job):** Uses Docker Buildx to build a minimal Alpine container, pushes to GitHub Container Registry (`ghcr.io`), and tags with both semantic branch tags (`qa` / `latest`) and the git commit SHA (`sha-<short-commit>`).
- **Deploy Stage (`deploy` job):** Securely transfers `docker-compose.yml` and `deploy.sh` to the Droplet via SSH, authenticates against GHCR, and executes atomic container replacement.

### Deployment Evidence Links
- **GitHub Repository:** [https://github.com/LukasPresti/is373-ci-cd](https://github.com/LukasPresti/is373-ci-cd)
- **Container Registry:** [https://github.com/LukasPresti/is373-ci-cd/pkgs/container/is373-website](https://github.com/LukasPresti/is373-ci-cd/pkgs/container/is373-website)
- **QA Workflow Run:** *(Added upon first run)*
- **Production Workflow Run:** *(Added upon first run)*

### Visible Change Demonstration
1. **QA Staging:** A visible change (Feature Announcement & Version update) was initially deployed to the `qa` branch. The QA site demonstrated the change with the amber **QA STAGING** banner while the Production site remained on the initial release.
2. **Production Promotion:** Upon merging into `main`, the Production site updated with the emerald **PRODUCTION** banner reflecting the new version and commit SHA.

---

## ?? Repository Contents
- `server.js` — Node.js Express web application and health check API.
- `package.json` — Application dependencies and test scripts.
- `Dockerfile` — Multi-stage lightweight Alpine container definition.
- `docker-compose.yml` — Compose specification with Traefik routing rules and SSL definitions.
- `deploy.sh` — Remote deployment orchestration script executed by CI/CD.
- `.github/workflows/deploy.yml` — Automated CI/CD pipeline workflow.
- `tests/app.test.js` — Automated validation test suite.
