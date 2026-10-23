import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { SolasEmergencyAlarmModal } from './SolasEmergencyAlarmModal';
import { BridgeMusterCommandConsole } from './BridgeMusterCommandConsole';
import { solasMusterService, type SolasMusterIncident } from '../../services/solasMusterService';

vi.mock('../../services/solasMusterService', () => ({
  solasMusterService: {
    getActiveMuster: vi.fn(),
    triggerEmergencyMuster: vi.fn(),
    checkinPassenger: vi.fn(),
    setAllClear: vi.fn(),
  }
}));

describe('SolasEmergencyAlarmModal', () => {
  const mockActiveIncident: SolasMusterIncident = {
    id: 1,
    incidentCode: 'SOLAS-2026-001',
    emergencyType: 'FIRE_ALARM',
    status: 'ACTIVE_MUSTER',
    triggeredBy: 'Chief Safety Officer',
    announcementText: 'Fire reported in deck 4 engine casing. All hands proceed to muster stations.',
    acousticSignalCode: '7_SHORT_1_LONG',
    totalSoulsOnBoard: 2500,
    musteredSoulsCount: 1200,
    musterCompletionRate: 48,
    triggeredAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when active muster incident is present', async () => {
    vi.mocked(solasMusterService.getActiveMuster).mockResolvedValueOnce(mockActiveIncident);

    render(<SolasEmergencyAlarmModal passengerMusterStation="STATION-C (Boong 5)" />);

    await waitFor(() => {
      expect(screen.getByText(/Báo Động Khẩn Cấp SOLAS Hàng Hải/i)).toBeInTheDocument();
      expect(screen.getByText(/TÍN HIỆU: 7 NGẮN 1 DÀI/i)).toBeInTheDocument();
      expect(screen.getByText(/Fire reported in deck 4 engine casing/i)).toBeInTheDocument();
      expect(screen.getByText(/STATION-C \(Boong 5\)/i)).toBeInTheDocument();
    });

    const ackButton = screen.getByRole('button', {
      name: /Tôi Đã Hiểu & Đang Di Chuyển Đến Trạm Tập Trung/i,
    });
    fireEvent.click(ackButton);

    expect(screen.queryByText(/Báo Động Khẩn Cấp SOLAS Hàng Hải/i)).not.toBeInTheDocument();
  });

  it('renders nothing when active muster is null', async () => {
    vi.mocked(solasMusterService.getActiveMuster).mockResolvedValueOnce(null);

    const { container } = render(<SolasEmergencyAlarmModal />);

    await waitFor(() => {
      expect(screen.queryByText(/Báo Động Khẩn Cấp SOLAS Hàng Hải/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });
});

describe('BridgeMusterCommandConsole', () => {
  const mockActiveIncident: SolasMusterIncident = {
    id: 1,
    incidentCode: 'SOLAS-2026-001',
    emergencyType: 'FIRE_ALARM',
    status: 'ACTIVE_MUSTER',
    triggeredBy: 'Bridge Officer on Duty',
    announcementText: 'General Alarm. Proceed to muster stations immediately.',
    totalSoulsOnBoard: 100,
    musteredSoulsCount: 85,
    musterCompletionRate: 85,
    headCountByStation: {
      A: 50,
      B: 35,
    },
    triggeredAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders telemetry and displays headcount gauge calculation correctly', async () => {
    vi.mocked(solasMusterService.getActiveMuster).mockResolvedValueOnce(mockActiveIncident);

    render(<BridgeMusterCommandConsole />);

    expect(screen.getByText(/Bridge SOLAS Command & Muster Telemetry Console/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/85 \/ 100/i)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Station A')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Station B')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
    });
  });

  it('triggers emergency broadcast on button click after confirmation', async () => {
    vi.mocked(solasMusterService.getActiveMuster).mockResolvedValueOnce(null);
    vi.mocked(solasMusterService.triggerEmergencyMuster).mockResolvedValueOnce(mockActiveIncident);

    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<BridgeMusterCommandConsole />);

    const triggerBtn = screen.getByRole('button', { name: /TRIGGER VESSEL-WIDE ALARM/i });
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(solasMusterService.triggerEmergencyMuster).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/GENERAL EMERGENCY ALARM BROADCASTED SUCCESSFULLY TO ALL TERMINALS/i)
      ).toBeInTheDocument();
    });
  });

  it('handles All-Clear broadcast signal correctly', async () => {
    vi.mocked(solasMusterService.getActiveMuster).mockResolvedValueOnce(mockActiveIncident);
    vi.mocked(solasMusterService.setAllClear).mockResolvedValueOnce({
      ...mockActiveIncident,
      status: 'ALL_CLEAR',
    });

    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<BridgeMusterCommandConsole />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Broadcast All-Clear/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Broadcast All-Clear/i }));

    await waitFor(() => {
      expect(solasMusterService.setAllClear).toHaveBeenCalledWith(1);
      expect(screen.getByText(/ALL-CLEAR SIGNAL TRANSMITTED/i)).toBeInTheDocument();
    });
  });
});
