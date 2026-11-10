import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import RegisterScreen from '@/app/(auth)/register';
import { authCopy as copy } from '@/content/auth';
import { registerWithEmail } from '@/features/auth/authService';

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({}),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock('@/features/auth/authService', () => ({
  registerWithEmail: jest.fn(),
}));

const mockedRegister = registerWithEmail as jest.MockedFunction<
  typeof registerWithEmail
>;

beforeEach(() => {
  mockReplace.mockClear();
  mockedRegister.mockReset();
  mockedRegister.mockResolvedValue({ ok: true });
});

function fillValidForm() {
  fireEvent.changeText(screen.getByLabelText(copy.emailLabel), 'new@user.co');
  fireEvent.changeText(screen.getByLabelText(copy.passwordLabel), 'secret123');
  fireEvent.changeText(
    screen.getByLabelText(copy.confirmPasswordLabel),
    'secret123',
  );
}

describe('registration flow', () => {
  it('blocks account creation until 18+ is confirmed', async () => {
    render(<RegisterScreen />);
    fillValidForm();
    // Age box intentionally left unchecked.
    fireEvent.press(screen.getByRole('button', { name: copy.registerAction }));

    expect(await screen.findByText(copy.errAgeRequired)).toBeOnTheScreen();
    expect(mockedRegister).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('creates the account once eligibility and fields are valid, then routes to verify', async () => {
    render(<RegisterScreen />);
    fillValidForm();
    fireEvent.press(
      screen.getByRole('checkbox', { name: copy.ageConfirmLabel }),
    );
    fireEvent.press(screen.getByRole('button', { name: copy.registerAction }));

    await waitFor(() => expect(mockedRegister).toHaveBeenCalledTimes(1));
    expect(mockedRegister).toHaveBeenCalledWith(
      expect.anything(),
      { email: 'new@user.co', password: 'secret123' },
      'bloom://sign-in',
    );
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/verify',
        params: { email: 'new@user.co' },
      }),
    );
  });

  it('rejects an invalid email before calling the backend', async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(
      screen.getByLabelText(copy.emailLabel),
      'not-an-email',
    );
    fireEvent.changeText(
      screen.getByLabelText(copy.passwordLabel),
      'secret123',
    );
    fireEvent.changeText(
      screen.getByLabelText(copy.confirmPasswordLabel),
      'secret123',
    );
    fireEvent.press(
      screen.getByRole('checkbox', { name: copy.ageConfirmLabel }),
    );
    fireEvent.press(screen.getByRole('button', { name: copy.registerAction }));

    expect(await screen.findByText(copy.errEmailInvalid)).toBeOnTheScreen();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText(copy.emailLabel), 'new@user.co');
    fireEvent.changeText(
      screen.getByLabelText(copy.passwordLabel),
      'secret123',
    );
    fireEvent.changeText(
      screen.getByLabelText(copy.confirmPasswordLabel),
      'different1',
    );
    fireEvent.press(
      screen.getByRole('checkbox', { name: copy.ageConfirmLabel }),
    );
    fireEvent.press(screen.getByRole('button', { name: copy.registerAction }));

    expect(
      await screen.findByText(copy.errPasswordsMismatch),
    ).toBeOnTheScreen();
    expect(mockedRegister).not.toHaveBeenCalled();
  });
});
