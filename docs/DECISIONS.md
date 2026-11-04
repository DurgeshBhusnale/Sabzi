# Decisions

Newest first. Short entries: date, decision, why. Do not reverse a decision without adding a new entry that explains why.

## 2026-11-05 — Expo (React Native) instead of Flutter
The PRD left Flutter or React Native open. Chose Expo + TypeScript so app, admin, shared types and edge functions share one language, so the app can be built and tested on Node in cloud sessions without an Android SDK, and because it matches the owner's web skills.

## 2026-11-05 — Supabase as the backend
Postgres with Row Level Security, built-in phone and email OTP, storage and edge functions cover v1 without a custom server.

## 2026-11-05 — Expo Push Service for notifications
Simpler than calling FCM directly; uses FCM underneath on Android.

## 2026-11-05 — Product decisions carried from planning
- One app, two roles; phone OTP mandatory, email optional
- English only in v1; ratings public from day one
- Reservations ("keep it aside") moved to v2; vendor demand sheet in v1 uses only buyer requests
- Pilot areas: Karve Nagar and Sus–Pashan
- No payments, no WhatsApp, no AI features in v1
