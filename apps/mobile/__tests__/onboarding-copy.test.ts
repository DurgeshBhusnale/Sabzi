import { en } from '../src/i18n/en';

// Owner review 2026-11-21: onboarding copy is positive, one title + one short subtitle per screen.
describe('onboarding copy', () => {
  const texts = [
    en.auth.roleBody, en.auth.buyerRoleBody, en.auth.vendorRoleBody, en.auth.profileBody, en.auth.nameBody,
    en.permissions.notifTitleBuyer, en.permissions.notifBodyBuyer, en.permissions.notifBodyVendor,
    en.permissions.locTitleBuyer, en.permissions.locBodyBuyer, en.permissions.locBodyVendor,
  ];

  it('does not raise fears with negative reassurances', () => {
    for (const t of texts) expect(t).not.toMatch(/never|no promotions|background|not shown/i);
  });

  it('uses the owner-approved lines', () => {
    expect(en.auth.profileBody).toBe('Your number helps our team reach you.');
    expect(en.permissions.notifTitleBuyer).toBe('Get notified when your vendor is at the gate');
    expect(en.auth.buyerRole).toBe("I'm a buyer");
    expect(en.auth.vendorRole).toBe("I'm a vendor");
  });

  it('keeps each subtitle to one sentence', () => {
    for (const t of [en.auth.profileBody, en.permissions.notifBodyBuyer, en.permissions.locBodyBuyer]) {
      expect(t.split(/\.\s/).length).toBe(1);
    }
  });
});
