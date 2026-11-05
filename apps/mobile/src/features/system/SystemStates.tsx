import { Linking } from 'react-native';
import { SUPPORT_PHONE, PLAY_STORE_URL } from '@sabzi/shared';
import { SystemScreen } from './SystemScreen';
import { openAppSettings } from '../../lib/permissions';
import { en } from '../../i18n/en';

/** X-01 … X-17 full-screen states (design brief §8). Each takes the one action it needs. */
export const X01NoInternet = ({ onRetry }: { onRetry: () => void }) => (
  <SystemScreen illustration="offline" title={en.system.offlineTitle} body={en.system.offlineBody} actionLabel={en.common.retry} onAction={onRetry} testID="x01" />
);
export const X05ServerError = ({ onRetry }: { onRetry: () => void }) => (
  <SystemScreen illustration="tools" title={en.system.serverError} actionLabel={en.common.retry} onAction={onRetry} secondaryLabel={en.system.contactSupport} onSecondary={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="x05" />
);
export const X06Timeout = ({ onRetry }: { onRetry: () => void }) => (
  <SystemScreen illustration="tools" title={en.system.timeout} actionLabel={en.common.retry} onAction={onRetry} testID="x06" />
);
export const X07SessionExpired = ({ onLogin }: { onLogin: () => void }) => (
  <SystemScreen illustration="lock" title={en.system.sessionExpired} actionLabel={en.system.logIn} onAction={onLogin} testID="x07" />
);
export const X09LocationDenied = ({ role, onContinue }: { role: 'buyer' | 'vendor'; onContinue: () => void }) => (
  <SystemScreen illustration="pin" title={role === 'vendor' ? en.system.locationDeniedVendor : en.system.locationDeniedBuyer} actionLabel={en.common.openSettings} onAction={openAppSettings} secondaryLabel={en.common.continue} onSecondary={onContinue} testID="x09" />
);
export const X10CameraDenied = ({ onSkip }: { onSkip: () => void }) => (
  <SystemScreen illustration="camera" title={en.permissions.cameraDenied} actionLabel={en.common.openSettings} onAction={openAppSettings} secondaryLabel={en.permissions.skipToday} onSecondary={onSkip} testID="x10" />
);
export const X11ForceUpdate = () => (
  <SystemScreen illustration="tools" title={en.system.forceUpdate} actionLabel={en.system.update} onAction={() => Linking.openURL(PLAY_STORE_URL)} testID="x11" />
);
export const X13Maintenance = ({ until }: { until?: string | null }) => (
  <SystemScreen illustration="tools" title={until ? en.system.maintenance(until) : en.system.maintenanceNoTime} testID="x13" />
);
export const X16OtpLimit = ({ wait, onEmail }: { wait: string; onEmail: () => void }) => (
  <SystemScreen illustration="lock" title={en.system.otpLimit(wait)} actionLabel={en.system.useEmail} onAction={onEmail} testID="x16" />
);
