# Environments and Secrets

## Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | Developer and automated database work | Synthetic only |
| Staging | Integrated preview, sandbox billing, and release candidates | Synthetic or consented test accounts only |
| Production | Public store release | Real user data |

Each environment uses separate Supabase projects, RevenueCat configuration, EAS environment values, crash-reporting configuration, and store products where supported.

## Configuration policy

- Commit `.env.example` files containing names and descriptions, never values.
- Values prefixed with `EXPO_PUBLIC_` are public client configuration and must not contain secrets.
- Store build-time secrets in EAS-managed secrets or the approved CI secret store.
- Store server-only values in Supabase project secrets or the approved server environment.
- Never expose a Supabase service-role or secret key in Expo code, a client environment variable, logs, screenshots, issues, or pull requests.
- Use platform-specific RevenueCat public SDK keys in the client; keep webhook authorization secrets server-side.
- Use synthetic accounts and data for local development, screenshots, tests, and demos.

## Environment promotion

1. Develop and reset migrations locally.
2. Verify migrations, RLS tests, generated types, and database advisors.
3. Apply to staging through an approved workflow.
4. Run integration and release-candidate tests.
5. Require explicit approval before any production migration, function deployment, secret change, or store submission.

Production is never used as an experimentation environment. Destructive database operations require an identified target, a backup/recovery plan, and explicit approval.

## Rotation and response

If a credential may have been exposed:

1. Stop using it and notify the owner privately.
2. Rotate or revoke it in the owning service.
3. Remove it from all active branches and artifacts without publicly repeating the value.
4. Review access logs and affected data.
5. Record remediation without placing secret material in the repository.
