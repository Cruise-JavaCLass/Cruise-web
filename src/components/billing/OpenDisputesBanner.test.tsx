import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OpenDisputesBanner } from './OpenDisputesBanner';
import { makePreview } from '../../test/fixtures/settlement';

describe('OpenDisputesBanner', () => {
  it('renders nothing when there are no open disputes', () => {
    render(
      <OpenDisputesBanner
        preview={makePreview()}
        canForceWithHold={true}
        forceWithHold={false}
        onForceWithHoldChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the dispute warning and the force-with-hold checkbox for managers', async () => {
    const user = userEvent.setup({ delay: null });
    const onForceWithHoldChange = vi.fn();
    render(
      <OpenDisputesBanner
        preview={makePreview({ openDisputeCount: 2, heldDisputeAmount: 50 })}
        canForceWithHold={true}
        forceWithHold={false}
        onForceWithHoldChange={onForceWithHoldChange}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/Có 2 khiếu nại đang mở/i);

    const checkbox = screen.getByRole('checkbox', {
      name: /Giữ lại khoản khiếu nại và tiếp tục tất toán/i,
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onForceWithHoldChange).toHaveBeenCalledWith(true);
  });

  it('hides the force-with-hold checkbox for non-manager roles', () => {
    render(
      <OpenDisputesBanner
        preview={makePreview({ openDisputeCount: 1, heldDisputeAmount: 20 })}
        canForceWithHold={false}
        forceWithHold={false}
        onForceWithHoldChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
