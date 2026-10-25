import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShinyText, SpotlightCard, OceanWaves } from './index';

describe('Creative Luxury UI Components (react-bits integration)', () => {
  it('renders ShinyText correctly with text prop', () => {
    render(<ShinyText text="Diamond Suite VIP" />);
    const elements = screen.getAllByText('Diamond Suite VIP');
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it('renders ShinyText with children', () => {
    render(<ShinyText>Royal Penthouse</ShinyText>);
    const elements = screen.getAllByText('Royal Penthouse');
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it('renders SpotlightCard with content and custom theme', () => {
    render(
      <SpotlightCard theme="dark" data-testid="spotlight-card">
        <h3>VIP Excursion Pass</h3>
        <p>Private Yacht & Snorkeling</p>
      </SpotlightCard>
    );
    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
    expect(screen.getByText('VIP Excursion Pass')).toBeInTheDocument();
    expect(screen.getByText('Private Yacht & Snorkeling')).toBeInTheDocument();
  });

  it('renders OceanWaves container without crashing', () => {
    const { container } = render(<OceanWaves data-testid="ocean-waves" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
