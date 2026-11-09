import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import SignInScreen from '@/app/(auth)/sign-in';
import { authCopy as copy } from '@/content/auth';
import { signInWithEmail } from '@/features/auth/authService';

jest.mock('@/lib/supabase', () => ({ getSupabaseClient: () => ({}) }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('@/features/auth/authService', () => ({
  signInWithEmail: jest.fn(),
}));

const mockedSignIn = signInWithEmail as jest.MockedFunction<
  typeof signInWithEmail
>;

beforeEach(() => {
  mockPush.mockClear();
  mockedSignIn.mockReset();
});

function fill(email: string, password: string) {
  fireEvent.changeText(screen.getByLabelText(copy.emailLabel), email);
  fireEvent.changeText(screen.getByLabelText(copy.passwordLabel), password);
}

describe('sign-in flow', () => {
  it('requires email and password before calling the backend', async () => {
    render(<SignInScreen />);
    fireEvent.press(screen.getByRole('button', { name: copy.signInAction }));

    expect(await screen.findByText(copy.errEmailRequired)).toBeOnTheScreen();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('shows a neutral error that does not reveal whether the account exists', async () => {
    mockedSignIn.mockResolvedValue({ ok: false, reason: 'invalid' });
    render(<SignInScreen />);
    fill('a@b.co', 'wrongpass');
    fireEvent.press(screen.getByRole('button', { name: copy.signInAction }));

    expect(await screen.findByText(copy.errSignInGeneric)).toBeOnTheScreen();
    expect(screen.queryByText(/exists|registered|not found/i)).toBeNull();
  });

  it('routes an unverified account to the verification screen', async () => {
    mockedSignIn.mockResolvedValue({ ok: false, reason: 'unverified' });
    render(<SignInScreen />);
    fill('a@b.co', 'secret123');
    fireEvent.press(screen.getByRole('button', { name: copy.signInAction }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/verify'));
  });

  it('does not show an error on success (the guard handles navigation)', async () => {
    mockedSignIn.mockResolvedValue({ ok: true });
    render(<SignInScreen />);
    fill('a@b.co', 'secret123');
    fireEvent.press(screen.getByRole('button', { name: copy.signInAction }));

    await waitFor(() => expect(mockedSignIn).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(copy.errSignInGeneric)).toBeNull();
  });
});
