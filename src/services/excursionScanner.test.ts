import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startQrCamera, startNfcReader, supportsNfc, scannerError } from './excursionScanner';

const decoder = vi.hoisted(() => ({ decode: vi.fn(), stop: vi.fn() }));
vi.mock('@zxing/browser', () => ({ BrowserQRCodeReader: class { decodeFromStream = decoder.decode; } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('isSecureContext', true);
  decoder.decode.mockResolvedValue({ stop: decoder.stop });
});
afterEach(() => vi.unstubAllGlobals());

describe('QR camera resource lifecycle', () => {
  const setup = () => {
    const trackStop = vi.fn();
    const stream = { getTracks: () => [{ stop: trackStop }] };
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    return { trackStop, stream, getUserMedia, video: document.createElement('video'), controller: new AbortController() };
  };
  it('requests the rear camera without audio and emits decoded ticket text', async () => {
    const s = setup(); const onCode = vi.fn();
    await startQrCamera(s.video, onCode, s.controller.signal);
    expect(s.getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false, video: expect.objectContaining({ facingMode: { ideal: 'environment' } }) }));
    decoder.decode.mock.calls[0][2]({ getText: () => 'EXC-TKT-42' });
    expect(onCode).toHaveBeenCalledWith('EXC-TKT-42');
    s.controller.abort();
    expect(s.trackStop).toHaveBeenCalledOnce();
    expect(decoder.stop).toHaveBeenCalledOnce();
    decoder.decode.mock.calls[0][2]({ getText: () => 'late-frame' });
    expect(onCode).toHaveBeenCalledTimes(1);
  });
  it('stops a stream acquired after the permission prompt was cancelled', async () => {
    const s = setup(); let grant!: (value: typeof s.stream) => void;
    s.getUserMedia.mockImplementation(() => new Promise((resolve) => { grant = resolve; }));
    const pending = startQrCamera(s.video, vi.fn(), s.controller.signal);
    await vi.waitFor(() => expect(s.getUserMedia).toHaveBeenCalled());
    s.controller.abort(); grant(s.stream);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(s.trackStop).toHaveBeenCalledOnce(); expect(decoder.decode).not.toHaveBeenCalled();
  });
  it('stops controls that finish starting after abort', async () => {
    const s = setup(); let ready!: (value: { stop: typeof decoder.stop }) => void;
    decoder.decode.mockImplementation(() => new Promise((resolve) => { ready = resolve; }));
    const pending = startQrCamera(s.video, vi.fn(), s.controller.signal);
    await vi.waitFor(() => expect(decoder.decode).toHaveBeenCalled());
    s.controller.abort(); ready({ stop: decoder.stop }); await pending;
    expect(s.trackStop).toHaveBeenCalledOnce(); expect(decoder.stop).toHaveBeenCalledOnce();
  });
  it('cleans up when decoder startup fails', async () => {
    const s = setup(); decoder.decode.mockRejectedValue(new Error('decoder failed'));
    await expect(startQrCamera(s.video, vi.fn(), s.controller.signal)).rejects.toThrow('decoder failed');
    expect(s.trackStop).toHaveBeenCalledOnce();
  });
  it('rejects insecure contexts without requesting a camera', async () => {
    const s = setup(); vi.stubGlobal('isSecureContext', false);
    await expect(startQrCamera(s.video, vi.fn(), s.controller.signal)).rejects.toThrow('HTTPS');
    expect(s.getUserMedia).not.toHaveBeenCalled();
  });
});

describe('NFC capability and lifecycle', () => {
  it('reports unsupported NFC without pretending to read', async () => {
    vi.stubGlobal('NDEFReader', undefined);
    expect(supportsNfc()).toBe(false);
    await expect(startNfcReader(vi.fn(), vi.fn(), new AbortController().signal)).rejects.toThrow('không hỗ trợ');
  });
  it('passes the UID unchanged and aborts actual reading on stop', async () => {
    const readers: EventTarget[] = []; let scanSignal!: AbortSignal;
    vi.stubGlobal('NDEFReader', class extends EventTarget {
      constructor() { super(); readers.push(this); }
      async scan({ signal }: { signal: AbortSignal }) { scanSignal = signal; }
    });
    const onCode = vi.fn(); const onError = vi.fn();
    const session = await startNfcReader(onCode, onError, new AbortController().signal);
    const reader = readers[0];
    reader.dispatchEvent(Object.assign(new Event('reading'), { serialNumber: '04:aa:bb' }));
    expect(onCode).toHaveBeenCalledWith('04:aa:bb');
    reader.dispatchEvent(Object.assign(new Event('reading'), { serialNumber: '' }));
    expect(onError).toHaveBeenCalledOnce();
    session.stop(); expect(scanSignal.aborted).toBe(true);
    reader.dispatchEvent(Object.assign(new Event('reading'), { serialNumber: 'late' }));
    expect(onCode).toHaveBeenCalledTimes(1);
  });
  it.each(['NotAllowedError', 'NotFoundError', 'NotReadableError'])('gives useful guidance for %s', (name) => {
    expect(scannerError(new DOMException('device failure', name))).not.toBe('device failure');
  });
});
