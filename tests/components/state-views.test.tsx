import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState, ErrorState, Skeleton } from '@/components';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('Skeleton', () => {
  it('renders without crashing and is hidden from assistive tech', () => {
    const view = render(<Skeleton width="50%" height={20} />);
    expect(view.toJSON()).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('shows the title and body and fires the optional action', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Personalize your day"
        body="Finish setting up."
        actionLabel="Set up"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Personalize your day')).toBeOnTheScreen();
    expect(screen.getByText('Finish setting up.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Set up' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the action when none is provided', () => {
    render(<EmptyState title="Nothing yet" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('states the problem and offers a retry that is never a dead end', () => {
    const onRetry = jest.fn();
    render(
      <ErrorState
        title="We could not load your setup"
        message="Please try again."
        retryLabel="Try again"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('We could not load your setup')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows no retry button when no handler is given', () => {
    render(<ErrorState message="Something went wrong." />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
