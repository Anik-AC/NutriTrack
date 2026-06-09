import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../Authentication/ForgotPassword'; // Adjust path as needed
import axiosInstance from '../../../utils/axiosInstance';
import { notify } from '../../../utils/notify';
import '@testing-library/jest-dom';
import { AxiosError } from 'axios';

// Mock axios
jest.mock('../../../utils/axiosInstance', () => ({
  post: jest.fn(),
}));

// Mock the toast helper
jest.mock('../../../utils/notify', () => ({
  notify: jest.fn(),
}));

describe('ForgotPassword', () => {
  const mockHandleClose = jest.fn();
  const mockToast = notify as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // For setTimeout testing
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not render when open is false', () => {
    const { container } = render(
      <ForgotPassword open={false} handleClose={mockHandleClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders correctly when open is true', () => {
    render(<ForgotPassword open={true} handleClose={mockHandleClose} />);
    
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText(/Enter your account's email address/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your-email@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  test('handles successful password reset request', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Reset link sent' },
    });

    render(<ForgotPassword open={true} handleClose={mockHandleClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('your-email@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Reset link sent',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    jest.advanceTimersByTime(300);
    expect(mockHandleClose).toHaveBeenCalled();
  });

  test('handles API error', async () => {
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'User not found' } },
    } as AxiosError);

    render(<ForgotPassword open={true} handleClose={mockHandleClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('your-email@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'User not found',
        status: 'error',
        duration: 8000,
        isClosable: true,
        position: 'top',
      });
    });

    jest.advanceTimersByTime(300);
    expect(mockHandleClose).toHaveBeenCalled();
  });

  test('shows loading state during submission', async () => {
    (axiosInstance.post as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ForgotPassword open={true} handleClose={mockHandleClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('your-email@example.com'), {
      target: { value: 'test@example.com' },
    });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueButton);

    expect(continueButton).toHaveAttribute('data-loading');
  });

  test('closes modal when close button is clicked', () => {
    render(<ForgotPassword open={true} handleClose={mockHandleClose} />);
    
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(mockHandleClose).toHaveBeenCalled();
  });
});