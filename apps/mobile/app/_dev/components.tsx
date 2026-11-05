import { router } from 'expo-router';
import { Screen, TopAppBar } from '../../src/ui';
import { ComponentGallery } from '../../src/features/dev/ComponentGallery';

export default function DevComponents() {
  return (
    <Screen header={<TopAppBar title="Components" onBack={() => router.back()} />}>
      <ComponentGallery />
    </Screen>
  );
}
