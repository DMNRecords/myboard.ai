# MYBOARD.AI — environments and secret handling

## Purpose

This document defines the minimum operating model before Stage 1. It does not create
cloud projects, secrets, deployments, or production access.

## Environments

| Environment | Purpose | Data | Deployment rule |
| --- | --- | --- | --- |
| `local` | Development and automated checks on a contributor machine. | Synthetic test data only. | Never use production credentials. |
| `staging` | Integration checks, payment sandbox, and internal acceptance. | Synthetic data or explicitly approved beta data. | Deploy only after CI passes. |
| `production` | Real users and paid exports. | Real user and payment metadata. | Manual founder approval after staging validation. |

Preview deployments may be introduced with the selected hosting provider. They must use
staging-only or mock integration credentials and must not connect to production data.

## Secret classes

### Public configuration

Values intentionally delivered to the browser, such as a Supabase project URL and its
publishable key. They are not credentials and remain subject to database RLS policies.

### Server secrets

Only server-side runtime or managed secret storage may access these values:

- Supabase service-role key;
- AI provider API key;
- payment-provider merchant credentials and webhook secret;
- transactional-email API key;
- error-monitoring ingestion token;
- signed-export or worker credentials, if later introduced.

Server secrets must never use an environment variable prefixed with `NEXT_PUBLIC_`, be
committed to Git, included in browser bundles, or written to logs and error messages.

## Access model

- The founder is the initial owner of hosting, Supabase, AI, payment, email, monitoring,
  and source-control accounts.
- Production credentials are separate from staging credentials and are granted only to
  the minimum services that need them.
- CI receives no production database or payment secret. It may use test-only credentials
  when integration tests are explicitly introduced.
- Admin access, entitlement changes, payment handling, and moderation review remain
  server-authorized operations; browser UI never establishes those rights.
- Secret rotation, access revocation, and incident response are recorded before public
  beta. Actual recovery and backup procedures are tested before commercial launch.

## Deployment and migration safeguards

- `main` is the intended protected release branch after a remote repository is created.
- Every pull request must pass formatting, lint, typecheck, unit tests, and the available
  E2E checks before merge.
- Database migrations are reviewed and applied to staging before production. Destructive
  migrations require explicit confirmation and a verified backup/restore path.
- Payment webhooks are accepted only on server endpoints after signature verification and
  idempotency checks. Production payment enablement requires a separate approval.
- Staging and production use separate Supabase projects, storage buckets, and webhook
  endpoints.

## Decisions deferred until Stage 1

- Hosting provider and primary deployment region;
- Supabase project creation and region;
- exact environment-variable names for the selected integrations;
- backup retention, recovery objective, and monitoring retention;
- GitHub branch-protection rules and deployment credentials.

These decisions must be recorded before their corresponding external service is created.
