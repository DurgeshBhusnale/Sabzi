import { act, fireEvent, screen } from '@testing-library/react-native';
import { darkColors, lightColors } from '@sabzi/shared';
import {
  Avatar,
  Banner,
  BottomNav,
  BottomSheet,
  Button,
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
  SegmentedControl,
  SkeletonBlock,
  Snackbar,
  StatTile,
  StatusPill,
  StopRow,
  TextInput,
  Toggle,
  TopAppBar,
  VendorCard,
  stepPrice,
  isValidPrice,
} from '../src/ui';
import { Home } from 'lucide-react-native';
import { flat, renderUi } from '../src/test/render';

const ramesh = {
  id: 'r',
  name: 'Ramesh Sabzi',
  rating: 4.4,
  ratingCount: 128,
  vehicle: 'tempo' as const,
  delivery: true,
  status: 'at_gate' as const,
  gateName: 'Gate 1',
  windowStart: '08:00',
  windowEnd: '08:45',
  topItems: [
    { name: 'Tomato', price: 40, unit: 'kg' as const },
    { name: 'Onion', price: 30, unit: 'kg' as const },
    { name: 'Methi', price: 15, unit: 'bunch' as const },
  ],
  itemCount: 12,
};

describe('Button', () => {
  it.each(['primary', 'secondary', 'tertiary', 'destructive'] as const)('%s renders default', async (variant) => {
    await renderUi(<Button label="Follow" variant={variant} />);
    expect(screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
  });
  it('disabled blocks presses', async () => {
    const onPress = jest.fn();
    await renderUi(<Button label="Follow" disabled onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ disabled: true });
  });
  it('loading keeps the label and shows a spinner', async () => {
    await renderUi(<Button label="Publishing" loading />);
    expect(screen.getByText('Publishing')).toBeTruthy();
    expect(screen.getByTestId('button-spinner')).toBeTruthy();
  });
  it('success shows the success label', async () => {
    await renderUi(<Button label="Follow" successLabel="Following" />);
    expect(screen.getByText('Following')).toBeTruthy();
  });
  it('pressed state darkens primary', async () => {
    await renderUi(<Button label="Follow" testID="b" />);
    const style = screen.getByTestId('b').props.style;
    expect(flat(style).backgroundColor).toBe(lightColors.primary);
  });
  it('buyer buttons are at least 48 dp', async () => {
    await renderUi(<Button label="Follow" testID="b" />);
    expect(flat(screen.getByTestId('b').props.style).minHeight).toBeGreaterThanOrEqual(48);
  });
  it('vendor XL and floating buttons are at least 56 dp', async () => {
    await renderUi(
      <>
        <Button label="Publish menu" size="xl" testID="xl" />
        <Button label="I've arrived" size="fab" testID="fab" />
      </>,
      { mode: 'vendor' },
    );
    expect(flat(screen.getByTestId('xl').props.style).minHeight).toBeGreaterThanOrEqual(56);
    expect(flat(screen.getByTestId('fab').props.style).minHeight).toBeGreaterThanOrEqual(56);
  });
});

describe('TextInput', () => {
  it.each(['text', 'phone', 'price', 'search', 'multiline', 'email'] as const)('%s renders', async (kind) => {
    await renderUi(<TextInput label={`L-${kind}`} kind={kind} value="" onChangeText={() => undefined} testID="in" />);
    expect(screen.getByTestId('in')).toBeTruthy();
  });
  it('phone shows +91 and limits to 10 digits', async () => {
    await renderUi(<TextInput label="Phone number" kind="phone" value="" testID="in" />);
    expect(screen.getByText('+91')).toBeTruthy();
    expect(screen.getByTestId('in').props.maxLength).toBe(10);
  });
  it('focused, error and disabled states', async () => {
    await renderUi(<TextInput label="Phone number" kind="phone" value="98220" error="Enter all 10 digits of your number." testID="in" />);
    expect(screen.getByText('Enter all 10 digits of your number.')).toBeTruthy();
    expect(flat(screen.getByTestId('in-box').props.style).borderColor).toBe(lightColors.error);
    await fireEvent(screen.getByTestId('in'), 'focus');
  });
  it('disabled is not editable', async () => {
    await renderUi(<TextInput label="Vehicle no." value="" disabled testID="in" />);
    expect(screen.getByTestId('in').props.editable).toBe(false);
  });
  it('multiline shows a counter', async () => {
    await renderUi(<TextInput label="Review" kind="multiline" maxChars={300} value="Good quality" testID="in" />);
    expect(screen.getByText('12 / 300')).toBeTruthy();
  });
});

describe('OtpInput', () => {
  it('empty, typing, error and success states', async () => {
    const onChange = jest.fn();
    const r = await renderUi(<OtpInput value="" onChange={onChange} message="Resend code in 0:24" />);
    expect(screen.getByText('Resend code in 0:24')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('otp'), '48a2');
    expect(onChange).toHaveBeenCalledWith('482');
    await r.rerender(<OtpInput value="482916" onChange={onChange} state="error" message="That code is wrong." />);
    expect(screen.getByText('That code is wrong.')).toBeTruthy();
  });
  it('paste fills all six', async () => {
    const onChange = jest.fn();
    await renderUi(<OtpInput value="" onChange={onChange} />);
    await fireEvent.changeText(screen.getByTestId('otp'), '482916999');
    expect(onChange).toHaveBeenCalledWith('482916');
  });
  it('success state', async () => {
    await renderUi(<OtpInput value="482916" onChange={() => undefined} state="success" message="Verified" />);
    expect(screen.getByText('Verified')).toBeTruthy();
  });
});

describe('Chip', () => {
  it('default, selected and disabled', async () => {
    const onPress = jest.fn();
    await renderUi(
      <>
        <Chip label="All" onPress={onPress} />
        <Chip label="5★" selected />
        <Chip label="1★" disabled onPress={onPress} />
        <Chip label="Fresh" kind="tag" selected />
        <Chip label="kg" kind="unit" selected />
      </>,
    );
    await fireEvent.press(screen.getByText('All'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox', { name: 'Fresh' }).props.accessibilityState.checked).toBe(true);
  });
});

describe('StatusPill', () => {
  it.each([
    ['at_gate', 'At Gate 1 now'],
    ['expected', 'Expected 8:00–8:45 AM'],
    ['leaving_soon', 'Leaving in 10 min'],
    ['left', 'Left at 8:40 AM'],
    ['not_coming', 'Not coming today'],
    ['verified', 'Verified'],
    ['sold_out', 'Sold out'],
    ['deal', 'Deal'],
  ] as const)('%s', async (status, label) => {
    await renderUi(<StatusPill status={status} label={label} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
  it('at the gate pulses', async () => {
    await renderUi(<StatusPill status="at_gate" label="At Gate 1 now" large />);
    expect(screen.getByTestId('pulse-dot')).toBeTruthy();
  });
});

describe('VendorCard', () => {
  it('large live card shows top 3 items and View menu', async () => {
    await renderUi(<VendorCard vendor={ramesh} size="large" />);
    expect(screen.getByText('At Gate 1 now')).toBeTruthy();
    expect(screen.getByText('₹40 / kg')).toBeTruthy();
    expect(screen.getByText('View menu · 12 items')).toBeTruthy();
  });
  it.each([
    ['expected', 'Expected 8:00–8:45 AM'],
    ['left', 'Left for today'],
    ['not_coming', 'Not coming today'],
  ] as const)('compact %s', async (status, label) => {
    await renderUi(<VendorCard vendor={{ ...ramesh, status }} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
  it('new vendor shows New instead of a rating', async () => {
    await renderUi(<VendorCard vendor={{ ...ramesh, ratingCount: 0, rating: 0 }} />);
    expect(screen.getByText(/New · Tempo/)).toBeTruthy();
  });
  it('loading skeleton', async () => {
    await renderUi(<VendorCard loading />);
    expect(screen.getByTestId('skeleton-vendorCard')).toBeTruthy();
  });
});

describe('MenuItemRow', () => {
  it('normal', async () => {
    await renderUi(<MenuItemRow name="Tomato" price={40} unit="kg" />);
    expect(screen.getByText('₹40 / kg')).toBeTruthy();
  });
  it('sold out', async () => {
    await renderUi(<MenuItemRow name="Coriander" price={10} unit="bunch" soldOut />);
    expect(screen.getByText('Sold out')).toBeTruthy();
    expect(screen.getByText('₹10 / bunch')).toBeTruthy();
  });
  it('deal', async () => {
    await renderUi(<MenuItemRow name="Tomato" price={40} unit="kg" dealPrice={30} />);
    expect(screen.getByText('₹30 / kg')).toBeTruthy();
    expect(screen.getByText('₹40 / kg')).toBeTruthy();
  });
});

describe('ItemTile', () => {
  it.each(['unselected', 'selected', 'priced', 'sold_out'] as const)('%s', async (state) => {
    await renderUi(<ItemTile name="Tomato" state={state} price={40} unit="kg" wasPrice={35} />);
    expect(screen.getByTestId('tile-Tomato')).toBeTruthy();
  });
  it('priced and changed shows was hint', async () => {
    await renderUi(<ItemTile name="Tomato" state="priced" price={40} unit="kg" wasPrice={35} />);
    expect(screen.getByText('was ₹35')).toBeTruthy();
  });
  it('missing price has a red outline', async () => {
    await renderUi(<ItemTile name="Tomato" state="selected" missingPrice />);
    expect(flat(screen.getByTestId('tile-Tomato').props.style).borderColor).toBe(lightColors.error);
  });
});

describe('PriceStepper', () => {
  it('steps and shows was hint', async () => {
    const onChange = jest.fn();
    await renderUi(<PriceStepper price={40} unit="kg" wasPrice={35} onChange={onChange} onUnitChange={() => undefined} />, { mode: 'vendor' });
    expect(screen.getByTestId('was-hint')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('step-5'));
    expect(onChange).toHaveBeenCalledWith(45);
    await fireEvent.press(screen.getByTestId('step--1'));
    expect(onChange).toHaveBeenCalledWith(39);
  });
  it('invalid shows an error', async () => {
    await renderUi(<PriceStepper price={0} unit="kg" onChange={() => undefined} />);
    expect(screen.getByText('Price must be between ₹1 and ₹999.')).toBeTruthy();
  });
  it('step buttons are 56 dp', async () => {
    await renderUi(<PriceStepper price={40} unit="kg" onChange={() => undefined} />, { mode: 'vendor' });
    expect(flat(screen.getByTestId('step-1').props.style).minHeight).toBeGreaterThanOrEqual(56);
  });
  it('helpers clamp and validate', () => {
    expect(stepPrice(3, -5)).toBe(0);
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(999)).toBe(true);
    expect(isValidPrice(1000)).toBe(false);
  });
});

describe('StopRow', () => {
  it.each([
    ['upcoming', '9:00–9:40 AM'],
    ['current', "You're here · 9:00–9:40 AM"],
    ['done', 'Done · 9:00–9:40 AM'],
    ['skipped', 'Not going today · followers told'],
  ] as const)('%s', async (state, text) => {
    await renderUi(<StopRow society="Sahyadri Heights" gate="Main Gate" windowStart="09:00" windowEnd="09:40" followers={54} state={state} />);
    expect(screen.getByText(text)).toBeTruthy();
  });
});

describe('RatingStars', () => {
  it.each([0, 3, 4.4, 5])('display %s', async (v) => {
    await renderUi(<RatingDisplay value={v} count={128} />);
    expect(screen.getByText(v.toFixed(1))).toBeTruthy();
  });
  it('input selects and is disabled', async () => {
    const onChange = jest.fn();
    const r = await renderUi(<RatingInput value={4} onChange={onChange} />);
    expect(screen.getByText('Very good')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('star-5'));
    expect(onChange).toHaveBeenCalledWith(5);
    await r.rerender(<RatingInput value={0} onChange={onChange} disabled />);
    expect(screen.getByTestId('star-1').props.accessibilityState.disabled).toBe(true);
  });
});

describe('ReviewCard', () => {
  const review = { id: '1', reviewerName: 'Priya', societyName: 'Green Park', stars: 5, tags: ['fresh', 'correct_weight'], text: 'Always fresh.', date: '2 Nov' };
  it('normal', async () => {
    await renderUi(<ReviewCard review={review} />);
    expect(screen.getByText('Correct weight')).toBeTruthy();
  });
  it('with reply', async () => {
    await renderUi(<ReviewCard review={{ ...review, vendorReply: 'Thank you, didi.', vendorName: 'Ramesh' }} />);
    expect(screen.getByText('Reply from Ramesh')).toBeTruthy();
  });
  it('hidden by admin', async () => {
    await renderUi(<ReviewCard review={{ ...review, hidden: true }} />);
    expect(screen.getByTestId('review-hidden-note')).toBeTruthy();
  });
});

describe('RequestCard', () => {
  it.each(['open', 'will_bring', 'cant_bring'] as const)('%s', async (status) => {
    await renderUi(<RequestCard item="Drumsticks" qty="500 g" vendorName="Ramesh Sabzi" status={status} />);
    expect(screen.getByTestId(`request-${status}`)).toBeTruthy();
  });
});

describe('StatTile', () => {
  it('normal, zero, loading', async () => {
    const r = await renderUi(<StatTile value={186} label="Followers" trend="+6 this week" />);
    expect(screen.getByText('+6 this week')).toBeTruthy();
    await r.rerender(<StatTile value={0} label="Alert opens" zeroHint="Send an alert first" />);
    expect(screen.getByText('Send an alert first')).toBeTruthy();
    await r.rerender(<StatTile value={0} label="x" loading />);
    expect(screen.getByTestId('stat-loading')).toBeTruthy();
  });
});

describe('BottomSheet and Dialog', () => {
  it('sheet open', async () => {
    await renderUi(
      <BottomSheet visible onClose={() => undefined} title="Follow Ramesh at which society?">
        <Toggle label="Arrival alerts" value onChange={() => undefined} />
      </BottomSheet>,
    );
    expect(screen.getByText('Follow Ramesh at which society?')).toBeTruthy();
  });
  it.each(['confirm', 'destructive', 'permission'] as const)('dialog %s', async (kind) => {
    const onConfirm = jest.fn();
    await renderUi(<Dialog visible kind={kind} title="Log out?" confirmLabel="Log out" cancelLabel="Cancel" onConfirm={onConfirm} onCancel={() => undefined} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('Snackbar', () => {
  it.each(['success', 'info', 'error'] as const)('%s', async (kind) => {
    await renderUi(<Snackbar message="Live for 186 followers" kind={kind} />);
    expect(screen.getByTestId(`snackbar-${kind}`)).toBeTruthy();
  });
  it('undo counts down and times out', async () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const onAction = jest.fn();
    await renderUi(<Snackbar message="Sent to 42 people" actionLabel="Undo" onAction={onAction} undoSeconds={5} onTimeout={onTimeout} />);
    expect(screen.getByTestId('snackbar-countdown').props.children).toBe('5');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('snackbar-countdown').props.children).toBe('3');
    await fireEvent.press(screen.getByTestId('snackbar-action'));
    expect(onAction).toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(onTimeout).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('Banner', () => {
  it.each(['offline', 'weak', 'pending', 'info', 'deal', 'error'] as const)('%s', async (kind) => {
    await renderUi(<Banner kind={kind} message="msg" actionLabel="View" onAction={() => undefined} />);
    expect(screen.getByTestId(`banner-${kind}`)).toBeTruthy();
  });
});

describe('Skeleton, EmptyState, Avatar', () => {
  it.each(['vendorCard', 'menuRow', 'statTile', 'list'] as const)('skeleton %s', async (kind) => {
    await renderUi(<SkeletonBlock kind={kind} count={2} />);
    expect(screen.getByTestId(`skeleton-${kind}`)).toBeTruthy();
  });
  it('empty state with action', async () => {
    const onAction = jest.fn();
    await renderUi(<EmptyState title="You aren't following anyone" body="Follow a vendor." actionLabel="Find vendors" onAction={onAction} />);
    await fireEvent.press(screen.getByText('Find vendors'));
    expect(onAction).toHaveBeenCalled();
  });
  it('avatar image, initial and loading', async () => {
    const r = await renderUi(<Avatar name="Ramesh Pawar" uri="https://x/y.jpg" />);
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
    await r.rerender(<Avatar name="Ramesh Pawar" />);
    expect(screen.getByText('RP')).toBeTruthy();
    await r.rerender(<Avatar name="Ramesh Pawar" loading />);
    expect(screen.getByTestId('avatar-loading')).toBeTruthy();
  });
});

describe('PhotoUploader', () => {
  it.each(['empty', 'capturing', 'uploading', 'uploaded', 'failed'] as const)('%s', async (state) => {
    await renderUi(<PhotoUploader state={state} progress={0.62} />);
    expect(screen.getByTestId(`photo-${state}`)).toBeTruthy();
  });
});

describe('Navigation pieces', () => {
  it('top app bar default, scrolled, back and society switcher', async () => {
    const onBack = jest.fn();
    const r = await renderUi(<TopAppBar title="All reviews" onBack={onBack} />);
    await fireEvent.press(screen.getByTestId('app-bar-back'));
    expect(onBack).toHaveBeenCalled();
    await r.rerender(<TopAppBar society="Green Park, Gate 1" onBellPress={() => undefined} unread scrolled />);
    expect(screen.getByTestId('app-bar-scrolled')).toBeTruthy();
    expect(screen.getByTestId('unread-dot')).toBeTruthy();
  });
  it('bottom nav selected, unselected and badge', async () => {
    const onSelect = jest.fn();
    await renderUi(
      <BottomNav
        items={[
          { key: 'home', label: 'Home', icon: Home },
          { key: 'requests', label: 'Requests', icon: Home, badge: 2 },
        ]}
        selected="home"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId('tab-home').props.accessibilityState.selected).toBe(true);
    expect(screen.getByText('2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-requests'));
    expect(onSelect).toHaveBeenCalledWith('requests');
    expect(flat(screen.getByTestId('tab-home').props.style).minHeight).toBeGreaterThanOrEqual(48);
  });
  it('toggle on, off, disabled and checkbox', async () => {
    const onChange = jest.fn();
    await renderUi(
      <>
        <Toggle label="Arrival alerts" value onChange={onChange} testID="t1" />
        <Toggle label="Evening deals" value={false} onChange={onChange} />
        <Toggle label="Buyers can call me" value={false} disabled onChange={onChange} />
        <Checkbox label="I can deliver to homes" value onChange={onChange} />
      </>,
    );
    await fireEvent.press(screen.getByTestId('t1'));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('switch', { name: 'Buyers can call me' }).props.accessibilityState.disabled).toBe(true);
  });
  it('segmented control', async () => {
    const onChange = jest.fn();
    await renderUi(<SegmentedControl options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }]} value="today" onChange={onChange} />);
    await fireEvent.press(screen.getByText('This week'));
    expect(onChange).toHaveBeenCalledWith('week');
  });
  it('QR card', async () => {
    await renderUi(<QrCard name="Ramesh Sabzi" code="RMSH4K7P" onShare={() => undefined} />);
    expect(screen.getByText('Scan to follow me')).toBeTruthy();
    expect(screen.getByText('Code RMSH4K7P')).toBeTruthy();
  });
});

describe('Touch targets', () => {
  it('chips, toggles and segmented options reach 48 dp', async () => {
    await renderUi(
      <>
        <Chip label="kg" kind="unit" testID="unit" />
        <Toggle label="A" value onChange={() => undefined} testID="tog" />
      </>,
    );
    expect(flat(screen.getByTestId('unit').props.style).minHeight).toBeGreaterThanOrEqual(48);
    expect(flat(screen.getByTestId('tog').props.style).minHeight).toBeGreaterThanOrEqual(48);
  });
});

describe('Dark mode', () => {
  it('uses dark tokens', async () => {
    await renderUi(<Button label="Follow" testID="b" />, { scheme: 'dark' });
    expect(flat(screen.getByTestId('b').props.style).backgroundColor).toBe(darkColors.primary);
  });
  it('text uses dark text colour', async () => {
    await renderUi(<StatusPill status="expected" label="Expected" />, { scheme: 'dark' });
    expect(flat(screen.getByText('Expected').props.style).color).toBe(darkColors.textSecondary);
  });
  it('vendor mode uses the larger type scale', async () => {
    await renderUi(<Button label="Publish" />, { mode: 'vendor' });
    expect(flat(screen.getByText('Publish').props.style).fontSize).toBe(18);
  });
});
