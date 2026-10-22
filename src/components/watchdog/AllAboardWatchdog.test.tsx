import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BridgeAllAboardBoard } from './BridgeAllAboardBoard';
import { PortSearchPartyModal } from './PortSearchPartyModal';
import {
  allAboardWatchdogService,
  AllAboardStatusDto,
  MissingPassengerDto,
} from '../../services/allAboardWatchdogService';

vi.mock('../../services/allAboardWatchdogService', () => ({
  allAboardWatchdogService: {
    getStatus: vi.fn(),
    dispatchAlert: vi.fn(),
    recordGangwayScan: vi.fn(),
  },
}));

describe('BridgeAllAboardBoard', () => {
  const mockStatus: AllAboardStatusDto = {
    tourId: 10,
    portCallId: 200,
    portName: 'Halong International Port',
    allAboardTime: new Date(Date.now() + 3600000).toISOString(),
    departureTime: new Date(Date.now() + 7200000).toISOString(),
    secondsRemaining: 3600,
    countdownExpired: false,
    totalEmbarkedPassengers: 100,
    passengersOnBoard: 98,
    missingAshoreCount: 2,
    aboardPercentage: 98.0,
    missingPassengers: [
      {
        passengerId: 101,
        fullName: 'Alexander Hamilton',
        cabinNumber: 'A-201',
        rfidTag: 'RFID-ALEX',
        phoneNumber: '+1555123456',
        emergencyContact: '+1555999999',
        currentStatus: 'DISEMBARKED_SHORE',
        disembarkedAt: new Date(Date.now() - 7200000).toISOString(),
        alertSent: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all-aboard countdown and missing passenger information', async () => {
    vi.mocked(allAboardWatchdogService.getStatus).mockResolvedValueOnce(mockStatus);

    render(<BridgeAllAboardBoard tourId={10} portCallId={200} />);

    expect(screen.getByText(/Port All-Aboard Countdown & Gangway Watchdog/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Halong International Port')).toBeInTheDocument();
      expect(screen.getByText(/98 \/ 100/i)).toBeInTheDocument();
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('2 Missing Ashore')).toBeInTheDocument();
      expect(screen.getByText('Alexander Hamilton')).toBeInTheDocument();
      expect(screen.getByText('A-201')).toBeInTheDocument();
      expect(screen.getByText('UNCONTACTED')).toBeInTheDocument();
    });
  });

  it('handles broadcast recall all ashore click with confirmation', async () => {
    vi.mocked(allAboardWatchdogService.getStatus).mockResolvedValue(mockStatus);
    vi.mocked(allAboardWatchdogService.dispatchAlert).mockResolvedValueOnce({
      alertBatchId: 'ALERT-WDG-999',
      targetedPassengersCount: 2,
      smsSentCount: 2,
      inAppSentCount: 2,
      paBroadcastTriggered: true,
      broadcastMessage: 'Recall',
      dispatchedAt: new Date().toISOString(),
      contactedPassengerIds: [101],
    });

    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<BridgeAllAboardBoard tourId={10} portCallId={200} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Recall All Ashore/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Recall All Ashore/i }));

    await waitFor(() => {
      expect(allAboardWatchdogService.dispatchAlert).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Alert sent to 2 missing guests/i)).toBeInTheDocument();
    });
  });
});

describe('PortSearchPartyModal', () => {
  const mockPassenger: MissingPassengerDto = {
    passengerId: 101,
    fullName: 'Alexander Hamilton',
    cabinNumber: 'A-201',
    rfidTag: 'RFID-ALEX',
    phoneNumber: '+1555123456',
    emergencyContact: '+1555999999',
    currentStatus: 'DISEMBARKED_SHORE',
    disembarkedAt: new Date().toISOString(),
    alertSent: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search party modal for selected missing passenger and dispatches direct SMS', async () => {
    vi.mocked(allAboardWatchdogService.dispatchAlert).mockResolvedValueOnce({
      alertBatchId: 'ALERT-SMS-1',
      targetedPassengersCount: 1,
      smsSentCount: 1,
      inAppSentCount: 0,
      paBroadcastTriggered: false,
      broadcastMessage: 'msg',
      dispatchedAt: new Date().toISOString(),
      contactedPassengerIds: [101],
    });

    const onClose = vi.fn();
    render(
      <PortSearchPartyModal
        passenger={mockPassenger}
        tourId={10}
        portCallId={200}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Port Search Party Coordinator/i)).toBeInTheDocument();
    expect(screen.getByText('Alexander Hamilton')).toBeInTheDocument();
    expect(screen.getByText('A-201')).toBeInTheDocument();

    const smsButton = screen.getByRole('button', { name: /Dispatch Direct SMS/i });
    fireEvent.click(smsButton);

    await waitFor(() => {
      expect(allAboardWatchdogService.dispatchAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          passengerIds: [101],
          sendSms: true,
        })
      );
      expect(screen.getByText(/Direct SMS alert successfully dispatched/i)).toBeInTheDocument();
    });
  });

  it('triggers emergency phone call correctly', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <PortSearchPartyModal
        passenger={mockPassenger}
        tourId={10}
        portCallId={200}
        onClose={vi.fn()}
      />
    );

    const callButton = screen.getByRole('button', { name: /Call ICE Emergency/i });
    fireEvent.click(callButton);

    expect(openSpy).toHaveBeenCalledWith('tel:+1555999999');
  });
});
