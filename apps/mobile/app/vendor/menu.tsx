import { router } from 'expo-router';
import { useState } from 'react';
import { Button, EmptyState, Screen, SkeletonBlock, TopAppBar } from '../../src/ui';
import { MenuEditor } from '../../src/features/vendor/MenuEditor';
import { buildDraft } from '../../src/features/vendor/menuLogic';
import { useInvalidateVendor, useTodayMenu, useUsualItems, useYesterdayMenu, vendorKeys } from '../../src/features/vendor/hooks';
import { publishMenu } from '../../src/features/vendor/api';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** V-05 */
export default function SetMenu() {
  const usual = useUsualItems();
  const today = useTodayMenu();
  const yesterday = useYesterdayMenu();
  const invalidate = useInvalidateVendor();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = usual.isLoading || today.isLoading || yesterday.isLoading;

  return (
    <Screen header={<TopAppBar title={en.vendor.menuTitle} onBack={() => router.back()} />}>
      {loading ? (
        <SkeletonBlock kind="menuRow" count={4} />
      ) : !usual.data?.length ? (
        <EmptyState title={en.vendor.noUsualItems} actionLabel={en.vendor.editUsual} onAction={() => router.push('/vendor-setup/items')} />
      ) : (
        <MenuEditor
          initial={buildDraft(usual.data, today.data?.lines ?? null, yesterday.data?.lines ?? null)}
          yesterday={yesterday.data?.lines ?? null}
          publishing={publishing}
          offlineNote={error}
          onPublish={async (items) => {
            setPublishing(true);
            setError(null);
            try {
              const r = await publishMenu(items);
              track('menu_published', { items: r.items });
              await invalidate(vendorKeys.today);
              router.replace({ pathname: '/(vendor)/today', params: { published: String(r.followers) } });
            } catch (e) {
              setError(e instanceof AppErrorException ? e.message : en.errors.network);
            } finally {
              setPublishing(false);
            }
          }}
        />
      )}
      {!loading && usual.data?.length ? <Button label={en.vendor.editUsual} variant="tertiary" onPress={() => router.push('/vendor-setup/items')} /> : null}
    </Screen>
  );
}
