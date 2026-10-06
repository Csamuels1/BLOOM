# ADR-0001: Expo and Supabase Application Architecture

- Status: Accepted
- Date: 2026-10-06

## Context

BLOOM needs one TypeScript mobile codebase for iOS and Android, a protected web moderation surface, managed authentication and data, subscription support, and reliable AI-assisted maintenance.

## Decision

Use React Native with Expo and Expo Router, strict TypeScript, NativeWind, Zustand, React Hook Form with Zod, Reanimated, Lucide, Victory Native, Supabase, and RevenueCat.

Use Expo Router web only for the protected staff moderation surface. Consumer scope remains mobile. Use EAS development builds once native subscription functionality is introduced.

Pin versions and commit the lockfile. Select exact compatible versions during Phase 1 after checking current Expo, NativeWind, Supabase, RevenueCat, and chart documentation.

## Consequences

- Mobile and web administration share domain types and design primitives.
- Native dependencies require development builds for full integration testing.
- Supabase migrations, policies, functions, Storage rules, seed data, and generated types become version-controlled application artifacts.
- Subscription receipts and entitlements remain managed by RevenueCat rather than custom receipt validation.
