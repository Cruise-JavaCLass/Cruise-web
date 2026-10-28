import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoyagePhaseControlCenter } from './VoyagePhaseControlCenter';
import { MaritimeTimezoneSchedulerModal } from './MaritimeTimezoneSchedulerModal';
import { voyageLifecycleService } from '../../services/voyageLifecycleService';
import type { VoyageLifecycleState } from '../../services/voyageLifecycleTypes';

vi.mock('../../services/voyageLifecycleService', () => ({
  voyageLifecycleService: {
    getAllVoyageStates: vi.fn(),
    getActiveVoyages: vi.fn(),
    createVoyageState: vi.fn(),
    transitionPhase: vi.fn(),
    syncPortTimezone: vi.fn(),
    getTimezoneSchedule: vi.fn(),
  },
}));

describe('VoyagePhaseControlCenter Component (KAN-495)', () => {
  const mockVoyage: VoyageLifecycleState = {
    id: 101,
    voyageNumber: 'VOY-MED-2026',
    shipId: 'SHIP-AURORA',
    itineraryName: 'Greek Isles 7-Night Cruise',
    currentPhase: 'AT_SEA',
    currentPortName: 'Santorini Sea Passage',
    currentTimezone: 'Europe/Athens',
    vesselClockOffsetMinutes: 120,
    clockSyncEnabled: true,
    taxExemptionActive: true,
    casinoOpen: true,
    transitionReason: 'Cruising Aegean Sea',
    phaseTransitionedAt: '2026-10-22T08:00:00Z',
    transitionedBy: 'Chief Purser',
    createdAt: '2026-10-22T08:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders control center title, statistics and voyage card', async () => {
    vi.mocked(voyageLifecycleService.getActiveVoyages).mockResolvedValueOnce([mockVoyage]);

    render(<VoyagePhaseControlCenter />);

    expect(screen.getByText('Voyage Global Lifecycle State Machine & Bridge Control')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('VOY-MED-2026')).toBeInTheDocument();
      expect(screen.getAllByText('AT_SEA').length).toBeGreaterThan(0);
      expect(screen.getByText('Santorini Sea Passage')).toBeInTheDocument();
    });

    // Verify maritime operational flags
    expect(screen.getAllByText('Duty/Tax-Free Waters').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Casino Open').length).toBeGreaterThan(0);
  });

  it('opens Advance Phase modal and submits transition', async () => {
    vi.mocked(voyageLifecycleService.getActiveVoyages).mockResolvedValue([mockVoyage]);
    vi.mocked(voyageLifecycleService.transitionPhase).mockResolvedValueOnce({
      ...mockVoyage,
      currentPhase: 'PORT_VISIT',
      taxExemptionActive: false,
      casinoOpen: false,
    });

    render(<VoyagePhaseControlCenter />);

    await waitFor(() => {
      expect(screen.getByText('Advance Phase')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Advance Phase'));

    expect(screen.getByText('Advance Voyage Operational Phase')).toBeInTheDocument();

    // Select PORT_VISIT
    const phaseSelect = screen.getByRole('combobox');
    fireEvent.change(phaseSelect, { target: { value: 'PORT_VISIT' } });

    // Submit transition
    const confirmBtn = screen.getByText('Confirm Phase Transition');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(voyageLifecycleService.transitionPhase).toHaveBeenCalledWith('VOY-MED-2026', {
        targetPhase: 'PORT_VISIT',
        currentPortName: 'Santorini Sea Passage',
        transitionReason: 'Routine scheduled transition to PORT_VISIT',
      });
    });
  });
});

describe('MaritimeTimezoneSchedulerModal Component (KAN-495)', () => {
  const mockVoyage: VoyageLifecycleState = {
    id: 101,
    voyageNumber: 'VOY-MED-2026',
    shipId: 'SHIP-AURORA',
    itineraryName: 'Greek Isles 7-Night Cruise',
    currentPhase: 'PORT_VISIT',
    currentPortName: 'Piraeus Port (Athens)',
    currentTimezone: 'Europe/Athens',
    vesselClockOffsetMinutes: 120,
    clockSyncEnabled: true,
    taxExemptionActive: false,
    casinoOpen: false,
    transitionReason: 'Docked at Piraeus',
    phaseTransitionedAt: '2026-10-22T08:00:00Z',
    transitionedBy: 'Chief Purser',
    createdAt: '2026-10-22T08:00:00Z',
  };

  it('renders modal with clocks and submits timezone synchronization', async () => {
    const handleClose = vi.fn();
    const handleUpdated = vi.fn();

    vi.mocked(voyageLifecycleService.getTimezoneSchedule).mockResolvedValueOnce({
      voyageNumber: 'VOY-MED-2026',
      currentTimezone: 'Europe/Athens',
      currentOffsetMinutes: 120,
      currentShipClockTime: '2026-10-22T10:00:00Z',
      plannedPortShifts: [
        {
          portName: 'Naples Harbor',
          timezone: 'Europe/Rome',
          clockOffsetMinutes: 60,
          scheduledTransitionTime: '2026-10-24T06:00:00Z',
          status: 'SCHEDULED',
        },
      ],
    });

    vi.mocked(voyageLifecycleService.syncPortTimezone).mockResolvedValueOnce({
      ...mockVoyage,
      currentTimezone: 'Europe/Rome',
      vesselClockOffsetMinutes: 60,
      currentPortName: 'Naples Harbor',
    });

    render(
      <MaritimeTimezoneSchedulerModal
        isOpen={true}
        onClose={handleClose}
        voyage={mockVoyage}
        onTimezoneUpdated={handleUpdated}
      />
    );

    expect(screen.getByText('Maritime Port Timezone Coordinator & Master Clock')).toBeInTheDocument();
    expect(screen.getByText('Vessel Master Operating Clock')).toBeInTheDocument();

    // Fill in shift
    const portInput = screen.getByDisplayValue('Piraeus Port (Athens)');
    fireEvent.change(portInput, { target: { value: 'Naples Harbor' } });

    const broadcastBtn = screen.getByText('Broadcast Master Clock Timezone Shift');
    fireEvent.click(broadcastBtn);

    await waitFor(() => {
      expect(voyageLifecycleService.syncPortTimezone).toHaveBeenCalledWith('VOY-MED-2026', {
        portName: 'Naples Harbor',
        timezone: 'Europe/Athens',
        clockOffsetMinutes: 120,
        adjustmentReason: 'Port approach vessel clock synchronization',
      });
      expect(handleUpdated).toHaveBeenCalled();
    });
  });
});
