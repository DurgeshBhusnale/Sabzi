import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { BottomNav, type NavItem } from './BottomNav';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Adapts expo-router Tabs to our BottomNav component. */
export function makeTabBar(items: NavItem[]) {
  return function TabBar({ state, navigateToTab }: BottomTabBarProps) {
    const current = state.routes[state.index]?.name ?? '';
    return (
      <BottomNav
        items={items}
        selected={current}
        onSelect={(key) => {
          const route = state.routes.find((r) => r.name === key);
          if (route) navigateToTab(route.key);
        }}
      />
    );
  };
}
