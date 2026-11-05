import { router } from 'expo-router';
import { ProfileScreen } from '../../src/features/account/ProfileScreen';

export default function Profile() {
  return <ProfileScreen onBack={() => router.back()} />;
}
