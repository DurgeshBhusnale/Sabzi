import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Bell, Code, FileText, HelpCircle, Languages, LogOut, Shield, Trash2 } from 'lucide-react-native';
import { PUBLIC_BASE_URL } from '@sabzi/shared';
import { useTheme, type SchemePreference } from '../../src/theme/ThemeProvider';
import { Dialog, Screen, SegmentedControl, Text, TopAppBar } from '../../src/ui';
import { LinkRow } from '../../src/features/account/ProfileScreen';
import { signOut } from '../../src/features/auth/api';
import { useSession } from '../../src/features/auth/session';
import { en } from '../../src/i18n/en';

/** S-12 with S-15 log-out confirm. */
export default function Settings() {
  const t = useTheme();
  const { refresh } = useSession();
  const [logout, setLogout] = useState(false);
  return (
    <Screen header={<TopAppBar title={en.settings.title} onBack={() => router.back()} />}>
      <View>
        <LinkRow icon={Bell} label={en.settings.notifications} onPress={() => router.push('/account/notifications')} />
        <LinkRow icon={Languages} label={en.settings.language} sub={`${en.settings.english} · ${en.settings.comingSoon}`} onPress={() => undefined} />
      </View>
      <View style={{ gap: t.spacing.sm, paddingVertical: t.spacing.xs }}>
        <Text variant="label">{en.settings.darkMode}</Text>
        <SegmentedControl<SchemePreference>
          testID="theme"
          value={t.preference}
          onChange={t.setPreference}
          options={[
            { value: 'system', label: en.settings.system },
            { value: 'light', label: en.settings.light },
            { value: 'dark', label: en.settings.dark },
          ]}
        />
      </View>
      <View>
        <LinkRow icon={HelpCircle} label={en.settings.help} onPress={() => router.push('/account/help')} />
        <LinkRow icon={Shield} label={en.settings.privacy} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/privacy`)} />
        <LinkRow icon={FileText} label={en.settings.terms} onPress={() => Linking.openURL(`${PUBLIC_BASE_URL}/terms`)} />
      </View>
      <View>
        <LinkRow icon={LogOut} label={en.settings.logOut} onPress={() => setLogout(true)} />
        <LinkRow icon={Trash2} label={en.settings.deleteAccount} danger last onPress={() => router.push('/account/delete')} />
      </View>
      {__DEV__ ? (
        <View>
          <LinkRow icon={Code} label="Dev: components" onPress={() => router.push('/_dev/components')} />
          <LinkRow icon={Code} label="Dev: system states X-01…X-17" onPress={() => router.push('/_dev/states')} />
        </View>
      ) : null}
      <Text variant="caption" color="textMuted" align="center">{en.settings.version(Constants.expoConfig?.version ?? '0.0.0')}</Text>
      <Dialog
        visible={logout}
        kind="destructive"
        title={en.settings.logoutTitle}
        body={en.settings.logoutBody}
        confirmLabel={en.settings.logOut}
        cancelLabel={en.common.cancel}
        onCancel={() => setLogout(false)}
        onConfirm={async () => {
          setLogout(false);
          await signOut();
          await refresh();
          router.replace('/');
        }}
      />
    </Screen>
  );
}
