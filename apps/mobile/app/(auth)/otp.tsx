// FUTURE: OTP entry is kept but not reachable while AUTH_METHODS.phoneOtp / emailOtp are false
// (SMS needs DLT registration). Sign-in currently goes through app/(auth)/signin.tsx (Google).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { formatDuration, LIMITS } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, OtpInput, Screen, Text, TopAppBar, type OtpState } from '../../src/ui';
import { sendPhoneOtp, verifyPhoneOtp } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-04: 6-box OTP, resend after 30 s, wrong / expired / blocked / verifying / success. */
export default function OtpScreen() {
  const t = useTheme();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const { refresh } = useSession();
  const [code, setCode] = useState('');
  const [state, setState] = useState<OtpState>('default');
  const [message, setMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState<number>(LIMITS.otpResendSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verify = async (value: string) => {
    setVerifying(true);
    setMessage(en.auth.verifying);
    const r = await verifyPhoneOtp(phone, value);
    setVerifying(false);
    if (r.ok) {
      setState('success');
      setMessage(en.auth.verified);
      await refresh();
      router.replace('/');
      return;
    }
    setState('error');
    if (r.code === 'otp_blocked' && 'blockedUntil' in r) {
      const mins = Math.max(1, (Date.parse(r.blockedUntil) - Date.now()) / 60000);
      setMessage(en.auth.tooMany(formatDuration(mins)));
    } else if (r.code === 'otp_expired') {
      setMessage(en.errors.otp_expired);
    } else if (r.code === 'otp_invalid') {
      const left = 'attemptsLeft' in r && r.attemptsLeft != null ? ` ${en.auth.attemptsLeft(r.attemptsLeft)}` : '';
      setMessage(en.errors.otp_invalid + left);
    } else {
      setMessage(en.errors.network);
    }
  };

  const onChange = (v: string) => {
    setCode(v);
    if (state !== 'default') {
      setState('default');
      setMessage(null);
    }
    if (v.length === 6) verify(v);
  };

  return (
    <Screen header={<TopAppBar onBack={() => router.back()} />}>
      <Text variant="h1" accessibilityRole="header">{en.auth.otpTitle}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
        <Text color="textSecondary">{en.auth.otpSentTo(phone)}</Text>
        <Button label={en.auth.editNumber} variant="tertiary" fullWidth={false} onPress={() => router.back()} />
      </View>
      <OtpInput value={code} onChange={onChange} state={state} message={message ?? (verifying ? en.auth.verifying : null)} autoFocus />
      <Text variant="caption" color="textMuted">{en.auth.autoRead}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text color="textSecondary">{seconds > 0 ? en.auth.resendIn(seconds) : en.auth.didntGet}</Text>
        <Button
          label={en.auth.resend}
          variant="tertiary"
          fullWidth={false}
          disabled={seconds > 0}
          testID="resend"
          onPress={async () => {
            setSeconds(LIMITS.otpResendSeconds);
            await sendPhoneOtp(phone);
          }}
        />
      </View>
    </Screen>
  );
}
