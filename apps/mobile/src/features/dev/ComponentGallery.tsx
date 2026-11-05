import { useState } from 'react';
import { View } from 'react-native';
import { Home, Heart } from 'lucide-react-native';
import { useTheme, type SchemePreference } from '../../theme/ThemeProvider';
import {
  Avatar,
  Banner,
  BottomNav,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  EmptyState,
  ItemTile,
  MenuItemRow,
  OtpInput,
  PhotoUploader,
  PriceStepper,
  QrCard,
  RatingDisplay,
  RatingInput,
  RequestCard,
  ReviewCard,
  Section,
  SegmentedControl,
  SkeletonBlock,
  Snackbar,
  StatTile,
  StatusPill,
  StopRow,
  Text,
  TextInput,
  Toggle,
  TopAppBar,
  VendorCard,
  type VendorCardData,
} from '../../ui';

const ramesh: VendorCardData = {
  id: 'r',
  name: 'Ramesh Sabzi',
  rating: 4.4,
  ratingCount: 128,
  vehicle: 'tempo',
  delivery: true,
  status: 'at_gate',
  gateName: 'Gate 1',
  windowStart: '08:00',
  windowEnd: '08:45',
  topItems: [
    { name: 'Tomato', price: 40, unit: 'kg' },
    { name: 'Onion', price: 30, unit: 'kg' },
    { name: 'Methi', price: 15, unit: 'bunch' },
  ],
  itemCount: 12,
};

const Row = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, alignItems: 'center' }}>{children}</View>;
};

/** Living style guide: every component in every state (design brief §4). Dev builds only. */
export function ComponentGallery() {
  const t = useTheme();
  const [price, setPrice] = useState(40);
  const [unit, setUnit] = useState<'kg' | 'g500' | 'g250' | 'bunch' | 'piece'>('kg');
  const [stars, setStars] = useState(4);
  const [otp, setOtp] = useState('482');
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState<null | 'confirm' | 'destructive' | 'permission'>(null);
  const [seg, setSeg] = useState('today');
  const [tog, setTog] = useState(true);
  return (
    <View style={{ gap: t.spacing.xl }}>
      <Section title="Theme">
        <SegmentedControl<SchemePreference> value={t.preference} onChange={t.setPreference} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <SegmentedControl<'buyer' | 'vendor'> value={t.mode} onChange={t.setMode} options={[{ value: 'buyer', label: 'Buyer scale' }, { value: 'vendor', label: 'Vendor scale' }]} />
      </Section>
      <Section title="Button">
        {(['primary', 'secondary', 'tertiary', 'destructive'] as const).map((v) => (
          <View key={v} style={{ gap: t.spacing.xs }}>
            <Button label={`${v} default`} variant={v} />
            <Button label={`${v} disabled`} variant={v} disabled />
            <Button label={`${v} loading`} variant={v} loading />
            <Button label={v} variant={v} successLabel="Saved" />
          </View>
        ))}
        <Button label="Publish menu" size="xl" />
        <Button label="Publishing" size="xl" loading />
        <Button label="I've arrived" size="fab" />
        <Button label="I've arrived" size="fab" disabled />
      </Section>
      <Section title="Text input">
        <TextInput label="Phone number" kind="phone" placeholder="10-digit mobile number" value="" />
        <TextInput label="Phone number" kind="phone" value="98220 41" error="Enter all 10 digits of your number." />
        <TextInput label="Price" kind="price" value="40" suffix="/ kg" />
        <TextInput label="Vehicle no." value="MH12 AB 4521" disabled />
        <TextInput kind="search" placeholder="Search society" value="" />
        <TextInput label="Review" kind="multiline" maxChars={300} value="Good quality but a bit costly compared to others." />
      </Section>
      <Section title="OTP input">
        <OtpInput value="" onChange={() => undefined} message="Resend code in 0:24" />
        <OtpInput value={otp} onChange={setOtp} />
        <OtpInput value="482916" onChange={() => undefined} state="error" message="That code is wrong. Check the SMS and try again." />
        <OtpInput value="482916" onChange={() => undefined} state="success" message="Verified" />
      </Section>
      <Section title="Chip">
        <Row>
          <Chip label="All" />
          <Chip label="5★" selected />
          <Chip label="4★" />
          <Chip label="1★" disabled />
        </Row>
        <Row>
          <Chip kind="tag" label="Fresh" selected />
          <Chip kind="tag" label="Correct weight" selected />
          <Chip kind="tag" label="Fair price" />
        </Row>
        <Row>
          {(['kg', '500 g', '250 g', 'bunch', 'piece'] as const).map((u, i) => (
            <Chip key={u} kind="unit" label={u} selected={i === 0} />
          ))}
        </Row>
      </Section>
      <Section title="Status pill">
        <Row>
          <StatusPill status="at_gate" label="At Gate 1 now" />
          <StatusPill status="expected" label="Expected 8:00–8:45 AM" />
          <StatusPill status="leaving_soon" label="Leaving in 10 min" />
          <StatusPill status="left" label="Left at 8:40 AM" />
          <StatusPill status="not_coming" label="Not coming today" />
          <StatusPill status="verified" label="Verified" />
          <StatusPill status="sold_out" label="Sold out" />
          <StatusPill status="deal" label="Deal" />
        </Row>
        <StatusPill status="at_gate" label="At Gate 1 now" large />
      </Section>
      <Section title="Vendor card">
        <VendorCard vendor={ramesh} size="large" />
        <VendorCard vendor={{ ...ramesh, id: 'i', name: 'Imran Vegetables', status: 'expected', rating: 3.9, ratingCount: 41, windowStart: '18:00', windowEnd: '18:45' }} />
        <VendorCard vendor={{ ...ramesh, status: 'left', since: new Date().toISOString() }} />
        <VendorCard vendor={{ ...ramesh, id: 'g', name: 'Ganesh Bhaji Wala', status: 'not_coming', ratingCount: 0 }} />
        <VendorCard loading />
      </Section>
      <Section title="Menu item row">
        <Card>
          <MenuItemRow name="Tomato" price={40} unit="kg" />
          <MenuItemRow name="Tomato" price={40} unit="kg" dealPrice={30} />
          <MenuItemRow name="Coriander" price={10} unit="bunch" soldOut />
        </Card>
      </Section>
      <Section title="Item tile">
        <Row>
          <View style={{ width: 100 }}><ItemTile name="Bhindi" state="unselected" /></View>
          <View style={{ width: 100 }}><ItemTile name="Tomato" state="selected" /></View>
          <View style={{ width: 100 }}><ItemTile name="Tomato" state="priced" price={40} unit="kg" wasPrice={35} /></View>
          <View style={{ width: 100 }}><ItemTile name="Coriander" state="sold_out" /></View>
          <View style={{ width: 100 }}><ItemTile name="Methi" state="selected" missingPrice /></View>
        </Row>
      </Section>
      <Section title="Price stepper">
        <Card><PriceStepper price={price} unit={unit} wasPrice={35} onChange={setPrice} onUnitChange={setUnit} /></Card>
        <Card><PriceStepper price={0} unit="kg" onChange={() => undefined} /></Card>
      </Section>
      <Section title="Stop row">
        <Card style={{ padding: 0 }}>
          <StopRow society="Tulsi Vihar" gate="Gate 2" windowStart="07:30" windowEnd="08:15" state="done" />
          <StopRow society="Green Park" gate="Gate 1" windowStart="08:00" windowEnd="08:45" followers={42} state="current" />
          <StopRow society="Sahyadri Heights" gate="Main Gate" windowStart="09:00" windowEnd="09:40" followers={54} state="upcoming" />
          <StopRow society="Nandanvan" gate="Gate A" windowStart="17:30" windowEnd="18:15" state="skipped" />
        </Card>
      </Section>
      <Section title="Rating stars">
        <RatingDisplay value={4.4} count={128} />
        <RatingDisplay value={0} count={0} />
        <RatingInput value={stars} onChange={setStars} />
        <RatingInput value={0} onChange={() => undefined} disabled />
      </Section>
      <Section title="Review card">
        <ReviewCard review={{ id: '1', reviewerName: 'Priya Kulkarni', societyName: 'Green Park', stars: 5, tags: ['fresh', 'correct_weight'], text: 'Vegetables are always fresh and he never cheats on weight.', date: '2 Nov', vendorName: 'Ramesh', vendorReply: 'Thank you, didi.' }} />
        <ReviewCard review={{ id: '2', reviewerName: 'Arjun Deshpande', societyName: 'Sahyadri Heights', stars: 3, tags: ['fair_price'], text: 'Good quality but a bit costly compared to others.', date: '31 Oct' }} />
        <ReviewCard review={{ id: '3', reviewerName: 'Meera Joshi', stars: 1, tags: [], text: 'Abusive text removed.', date: '1 Nov', hidden: true }} />
      </Section>
      <Section title="Request card">
        <RequestCard item="Drumsticks" qty="500 g" vendorName="Ramesh Sabzi" society="Green Park" status="open" />
        <RequestCard item="Broccoli" qty="1 piece" vendorName="Ramesh Sabzi" note="Medium size please" status="will_bring" />
        <RequestCard item="Baby corn" qty="250 g" vendorName="Ramesh Sabzi" status="cant_bring" />
      </Section>
      <Section title="Stat tile">
        <Row>
          <StatTile value={186} label="Followers" trend="+6 this week" />
          <StatTile value={0} label="Alert opens" zeroHint="Send an alert first" />
          <StatTile value={0} label="x" loading />
        </Row>
      </Section>
      <Section title="Bottom sheet · dialog">
        <Button label="Open bottom sheet" variant="secondary" onPress={() => setSheet(true)} />
        <Row>
          <Button label="Confirm" variant="tertiary" fullWidth={false} onPress={() => setDialog('confirm')} />
          <Button label="Destructive" variant="tertiary" fullWidth={false} onPress={() => setDialog('destructive')} />
          <Button label="Permission" variant="tertiary" fullWidth={false} onPress={() => setDialog('permission')} />
        </Row>
        <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Follow Ramesh at which society?" footer={<Button label="Follow" onPress={() => setSheet(false)} />}>
          <Toggle label="Arrival alerts" value onChange={() => undefined} />
          <Toggle label="Evening deals" value={false} onChange={() => undefined} />
        </BottomSheet>
        <Dialog
          visible={dialog !== null}
          kind={dialog ?? 'confirm'}
          title={dialog === 'permission' ? 'Allow notifications?' : 'Log out?'}
          body="You'll need an OTP to log back in."
          confirmLabel={dialog === 'permission' ? 'Allow' : 'Log out'}
          cancelLabel={dialog === 'permission' ? 'Not now' : 'Cancel'}
          onConfirm={() => setDialog(null)}
          onCancel={() => setDialog(null)}
        />
      </Section>
      <Section title="Snackbar">
        <Snackbar kind="success" message="Live for 186 followers" actionLabel="Undo" undoSeconds={5} />
        <Snackbar kind="info" message="Saved, will send when online" />
        <Snackbar kind="error" message="Photo didn't upload." actionLabel="Retry" />
      </Section>
      <Section title="Banner">
        <Banner kind="offline" message="Offline · showing data from 7:12 AM" />
        <Banner kind="weak" message="Slow connection. Things may take longer." />
        <Banner kind="pending" message="2 actions waiting to send" actionLabel="View" />
        <Banner kind="info" message="Buyers will see you after verification." />
        <Banner kind="deal" message="Evening deals from 2 vendors" actionLabel="See deals" />
        <Banner kind="error" message="You won't know when vendors arrive." actionLabel="Open settings" />
      </Section>
      <Section title="Skeleton">
        <SkeletonBlock kind="vendorCard" />
        <SkeletonBlock kind="menuRow" />
        <SkeletonBlock kind="statTile" />
      </Section>
      <Section title="Empty state">
        <Card><EmptyState title="You aren't following anyone" body="Follow a vendor to know when he reaches your gate." actionLabel="Find vendors" /></Card>
      </Section>
      <Section title="Avatar · photo uploader">
        <Row>
          <Avatar name="Priya Kulkarni" />
          <Avatar name="Ramesh Pawar" loading />
        </Row>
        <Row>
          <View style={{ width: 110 }}><PhotoUploader state="empty" /></View>
          <View style={{ width: 110 }}><PhotoUploader state="uploading" progress={0.62} /></View>
          <View style={{ width: 110 }}><PhotoUploader state="failed" /></View>
        </Row>
      </Section>
      <Section title="Toggle · checkbox · segmented">
        <Card>
          <Toggle label="Arrival alerts" value={tog} onChange={setTog} />
          <Toggle label="Evening deals" value={false} onChange={() => undefined} />
          <Toggle label="Buyers can call me" value={false} disabled onChange={() => undefined} />
          <Checkbox label="I can deliver to homes" value onChange={() => undefined} />
        </Card>
        <SegmentedControl value={seg} onChange={setSeg} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }]} />
      </Section>
      <Section title="Top app bar · bottom navigation">
        <TopAppBar society="Green Park, Gate 1" onBellPress={() => undefined} unread />
        <TopAppBar title="All reviews" onBack={() => undefined} scrolled />
        <BottomNav items={[{ key: 'home', label: 'Home', icon: Home }, { key: 'following', label: 'Following', icon: Heart, badge: 2 }]} selected="home" onSelect={() => undefined} />
      </Section>
      <Section title="QR card">
        <QrCard name="Ramesh Sabzi" code="RMSH4K7P" onShare={() => undefined} />
      </Section>
      <Text variant="caption" color="textMuted">Sabzi · design system v1</Text>
    </View>
  );
}
