import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component giả lập lỗi ném ra khi render
const FaultyComponent = () => {
  throw new Error('Test rendering crash');
};

describe('ErrorBoundary Component', () => {
  it('renders children correctly when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Child Component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Child Component')).toBeInTheDocument();
  });

  it('catches runtime errors and displays fallback UI', () => {
    // Tạm thời tắt console.error để không in red error log trong test report
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Đã xảy ra lỗi giao diện')).toBeInTheDocument();
    expect(screen.getByText('Test rendering crash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tải lại trang/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
