import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import FoundationScreen from '@/app/foundation';
import WelcomeScreen from '@/app/index';
import { foundationCopy as copy } from '@/content/foundation';

describe('foundation navigation', () => {
  it('opens the foundation screen and returns to welcome', async () => {
    const router = renderRouter(
      {
        _layout: RootLayout,
        index: WelcomeScreen,
        foundation: FoundationScreen,
      },
      { initialUrl: '/' },
    );

    expect(screen.getByRole('header', { name: copy.name })).toBeOnTheScreen();
    expect(screen.getByText(copy.notice)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('link', { name: copy.explore }));
    expect(await screen.findByText(copy.title)).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/foundation');
    expect(screen.getByRole('header', { name: copy.title })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('link', { name: copy.back }));
    expect(await screen.findByText(copy.name)).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/');
  });

  it('supports a direct foundation link', () => {
    renderRouter(
      {
        _layout: RootLayout,
        index: WelcomeScreen,
        foundation: FoundationScreen,
      },
      { initialUrl: '/foundation' },
    );
    expect(screen.getByText(copy.title)).toBeOnTheScreen();
  });
});
