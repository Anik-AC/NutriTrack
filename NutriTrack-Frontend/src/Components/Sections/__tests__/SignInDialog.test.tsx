import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInDialog from '../Authentication/SignInDialog';
import axiosInstance from '../../../utils/axiosInstance';
import { notify } from '../../../utils/notify';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { UserContext } from "../../../contexts/UserContext";
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../../../utils/axiosInstance', () => ({
  post: jest.fn(),
}));

jest.mock('../../../utils/notify', () => ({
  notify: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: jest.fn(),
}));

// Mock UserContext
const mockSetLoggedUser = jest.fn();
const MockUserContextProvider = ({ children }: { children: React.ReactNode }) => (
  <UserContext.Provider value={{ setLoggedUser: mockSetLoggedUser, loggedUser: null, logout: jest.fn() }}>
    {children}
  </UserContext.Provider>
);

describe('SignInDialog', () => {
  const mockOnClose = jest.fn();
  const mockOpenSignUp = jest.fn();
  const mockOpenForgotPassword = jest.fn();
  const mockToast = notify as jest.Mock;
  const mockNavigate = jest.fn();
  const mockGoogleLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useGoogleLogin as jest.Mock).mockReturnValue(mockGoogleLogin);
  });

  const renderWithContext = (component: React.ReactElement) => {
    return render(<MockUserContextProvider>{component}</MockUserContextProvider>);
  };

  test('does not render when open is false', () => {
    const { container } = renderWithContext(
      <SignInDialog open={false} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    expect(container.firstChild).toBeNull();
  });
  test('handles successful Google login', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
      data: {
        token: 'mock-token',
        userType: 'user',
        profileCompleted: true,
        userProfile: { user: 'user123', name: 'Test User' },
        expiresIn: 3600,
        verified: true,
      },
    });

    (useGoogleLogin as jest.Mock).mockImplementation(({ onSuccess }) => () => {
      onSuccess({ access_token: 'google-token' });
    });

    renderWithContext(
      <SignInDialog open={true} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/google/signin', {
        access_token: 'google-token',
      });
      expect(mockSetLoggedUser).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login Successful!',
        description: 'You have signed in using Google.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('toggles password visibility', () => {
    renderWithContext(
      <SignInDialog open={true} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('opens forgot password dialog', () => {
    renderWithContext(
      <SignInDialog open={true} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    
    fireEvent.click(screen.getByText('Forgot your password?'));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOpenForgotPassword).toHaveBeenCalled();
  });

  test('opens sign up dialog', () => {
    renderWithContext(
      <SignInDialog open={true} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    
    fireEvent.click(screen.getByText('Sign up'));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOpenSignUp).toHaveBeenCalled();
  });

  test('closes modal when close button is clicked', () => {
    renderWithContext(
      <SignInDialog open={true} onClose={mockOnClose} openSignUp={mockOpenSignUp} openForgotPassword={mockOpenForgotPassword} />
    );
    
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});