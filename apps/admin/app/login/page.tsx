'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { APP_NAME } from '@sabzi/shared/constants';
import { Button, Card, Field, Input } from '../../components/ui';
import { sb, rpc } from '../../lib/supabase';

type Step = 'password' | 'enroll' | 'code';

/** A-01: email + password, then a 6-digit code (TOTP). States: default, wrong password, code step, locked. */
export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const afterPassword = async () => {
    const me = await rpc<{ admin_level: string; active: boolean } | null>('admin_me');
    if (!me || !me.active) {
      await sb().auth.signOut();
      throw new Error('This account is not a Sabzi team account.');
    }
    const { data } = await sb().auth.mfa.listFactors();
    const totp = data?.totp?.find((f) => f.status === 'verified');
    if (totp) {
      setFactorId(totp.id);
      setStep('code');
      return;
    }
    const enrolled = await sb().auth.mfa.enroll({ factorType: 'totp', friendlyName: `${APP_NAME} admin` });
    if (enrolled.error) throw enrolled.error;
    setFactorId(enrolled.data.id);
    setQr(enrolled.data.totp.qr_code);
    setSecret(enrolled.data.totp.secret);
    setStep('enroll');
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await sb().auth.signInWithPassword({ email, password });
      if (err) throw new Error(/rate|too many/i.test(err.message) ? 'Too many tries. This account is locked for a while. Try again later.' : 'Wrong email or password.');
      await afterPassword();
    } catch (x) {
      setError((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await sb().auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) return setError('That code is wrong. Check your authenticator app.');
    router.replace('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-md">
      <Card className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{APP_NAME} Admin</h1>
        <p className="mb-lg text-text-secondary">{step === 'password' ? 'Field team login' : '2-step verification'}</p>
        {step === 'password' ? (
          <form onSubmit={submitPassword} className="flex flex-col gap-md" aria-label="Admin login">
            <Field label="Email"><Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
            <Button type="submit" loading={busy}>Continue</Button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="flex flex-col gap-md" aria-label="Enter code">
            {step === 'enroll' ? (
              <div className="flex flex-col items-center gap-xs text-sm text-text-secondary">
                <p>Scan this with Google Authenticator or a similar app, then enter the 6-digit code.</p>
                {qr ? <img src={qr} alt="Authenticator QR code" width={180} height={180} /> : null}
                {secret ? <code className="break-all rounded-input bg-surface-2 p-xs">{secret}</code> : null}
              </div>
            ) : null}
            <Field label="6-digit code"><Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></Field>
            {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
            <Button type="submit" loading={busy} disabled={code.length !== 6}>Verify</Button>
          </form>
        )}
      </Card>
    </main>
  );
}
