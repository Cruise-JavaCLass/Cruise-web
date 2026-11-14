export interface ScanSession { stop: () => void }

/** Abort also covers a permission prompt that resolves after the view has closed. */
export async function startQrCamera(video: HTMLVideoElement, onCode: (code: string) => void, signal: AbortSignal): Promise<ScanSession> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera cần kết nối HTTPS và trình duyệt hỗ trợ. Bạn có thể nhập mã bên dưới.');
  }
  const { BrowserQRCodeReader } = await import('@zxing/browser');
  if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  let controls: ScanSession | undefined;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    signal.removeEventListener('abort', stop);
    controls?.stop();
    stream.getTracks().forEach((track) => track.stop());
    if (video.srcObject === stream) video.srcObject = null;
  };
  signal.addEventListener('abort', stop, { once: true });
  if (signal.aborted) { stop(); throw new DOMException('Stopped', 'AbortError'); }
  try {
    controls = await new BrowserQRCodeReader().decodeFromStream(stream, video, (result) => {
      if (result && !stopped && !signal.aborted) onCode(result.getText());
    });
    if (stopped) controls.stop();
    return { stop };
  } catch (error) { stop(); throw error; }
}

interface NfcReadingEvent extends Event { serialNumber: string }
interface NfcReader extends EventTarget { scan: (options: { signal: AbortSignal }) => Promise<void> }
type NfcWindow = Window & { NDEFReader?: new () => NfcReader };

export function supportsNfc(): boolean {
  return Boolean(window.isSecureContext && (window as NfcWindow).NDEFReader);
}

/** Send the tag UID unchanged; the API must match it to a passenger. */
export async function startNfcReader(onCode: (code: string) => void, onError: (message: string) => void, signal: AbortSignal): Promise<ScanSession> {
  const Reader = (window as NfcWindow).NDEFReader;
  if (!window.isSecureContext || !Reader) {
    throw new Error('Thiết bị này không hỗ trợ Web NFC. Hãy quét QR hoặc dùng đầu đọc thẻ ngoài.');
  }
  const reader = new Reader();
  const controller = new AbortController();
  const read = (event: Event) => {
    if (controller.signal.aborted) return;
    const uid = (event as NfcReadingEvent).serialNumber?.trim();
    if (uid) onCode(uid);
    else onError('Không đọc được mã thẻ. Hãy quét QR hoặc nhập mã.');
  };
  const readError = () => onError('Không đọc được thẻ NFC. Hãy thử lại hoặc dùng QR.');
  const stop = () => {
    controller.abort();
    reader.removeEventListener('reading', read);
    reader.removeEventListener('readingerror', readError);
    signal.removeEventListener('abort', stop);
  };
  reader.addEventListener('reading', read);
  reader.addEventListener('readingerror', readError);
  signal.addEventListener('abort', stop, { once: true });
  if (signal.aborted) stop();
  try {
    await reader.scan({ signal: controller.signal });
    if (signal.aborted) stop();
    return { stop };
  } catch (error) { stop(); throw error; }
}

export function scannerError(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Chưa được cấp quyền camera/NFC. Hãy cho phép trong trình duyệt hoặc nhập mã.';
  if (name === 'NotFoundError') return 'Không tìm thấy camera hoặc đầu đọc NFC trên thiết bị.';
  if (name === 'NotReadableError') return 'Camera/đầu đọc đang bận. Hãy đóng ứng dụng khác rồi thử lại.';
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message : 'Không thể quét. Hãy thử lại hoặc nhập mã.';
}
