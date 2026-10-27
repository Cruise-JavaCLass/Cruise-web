import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SpotlightCard } from './SpotlightCard';
import { TiltedCard } from './TiltedCard';
import { ShinyText, DecryptedText } from './ShinyText';
import { Magnet } from './Magnet';
import { MaritimeGlobe3D } from './MaritimeGlobe3D';
import { CommandPaletteModal } from './CommandPaletteModal';

describe('React Bits, Three.js & UI/UX Pro Max Suite', () => {
  it('renders SpotlightCard and tracks cursor hover state', () => {
    render(
      <SpotlightCard data-testid="spotlight-box">
        <span>Luxury Telemetry</span>
      </SpotlightCard>
    );

    const card = screen.getByTestId('spotlight-box');
    expect(screen.getByText('Luxury Telemetry')).toBeInTheDocument();

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 80, clientY: 60 });
    fireEvent.mouseLeave(card);
  });

  it('renders TiltedCard and updates 3D perspective on mouse move', () => {
    render(
      <TiltedCard data-testid="tilted-box">
        <span>3D Boarding Pass</span>
      </TiltedCard>
    );

    const card = screen.getByTestId('tilted-box');
    expect(screen.getByText('3D Boarding Pass')).toBeInTheDocument();

    fireEvent.mouseMove(card, { clientX: 50, clientY: 40 });
    fireEvent.mouseLeave(card);
    expect(card.style.transform).toContain('perspective(1000px)');
  });

  it('renders ShinyText, DecryptedText and Magnet interactive wrappers', () => {
    render(
      <div>
        <ShinyText text="Autonomous Fleet AI" />
        <DecryptedText text="20°57′N 107°04′E" />
        <Magnet>
          <button type="button">Explore Voyages</button>
        </Magnet>
      </div>
    );

    expect(screen.getByText('Autonomous Fleet AI')).toBeInTheDocument();
    const cipherEl = screen.getByTitle('20°57′N 107°04′E');
    expect(cipherEl).toBeInTheDocument();
    fireEvent.mouseEnter(cipherEl);

    const btn = screen.getByText('Explore Voyages');
    fireEvent.mouseMove(btn.parentElement!, { clientX: 25, clientY: 25 });
    fireEvent.mouseLeave(btn.parentElement!);
  });

  it('renders MaritimeGlobe3D with interactive port waypoints and mode switcher', () => {
    render(<MaritimeGlobe3D />);

    expect(screen.getByTestId('maritime-globe-3d')).toBeInTheDocument();
    expect(screen.getByText('Three.js 3D Fleet Holodeck')).toBeInTheDocument();

    const radarBtn = screen.getByText('Polar Radar');
    fireEvent.click(radarBtn);

    const phuQuocBtn = screen.getByText('Phú Quốc (An Thới)');
    fireEvent.click(phuQuocBtn);
    expect(screen.getByText('10°01′N 104°00′E')).toBeInTheDocument();
  });

  it('renders CommandPaletteModal, filters modules and closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPaletteModal isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('command-palette-modal')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Tìm nhanh phân hệ/i);
    fireEvent.change(input, { target: { value: 'POS' } });

    expect(screen.getByText('POS & Chi tiêu Onboard')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
