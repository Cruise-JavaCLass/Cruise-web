import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  createTourProvider,
  updateTourProvider,
  type TourProvider,
} from '../../services/tourService';

const providerFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên đối tác.'),
  taxCode: z.string(),
  licenseNumber: z.string(),
  email: z
    .string()
    .trim()
    .email('Vui lòng nhập địa chỉ email hợp lệ.')
    .or(z.literal('')),
  emergencyHotline: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập hotline khẩn cấp.')
    .refine((value) => {
      if (!value) return true;
      const digitCount = value.replace(/\D/g, '').length;
      return /^\+?[0-9\s().-]+$/.test(value) && digitCount >= 7 && digitCount <= 15;
    }, 'Vui lòng nhập số hotline hợp lệ.'),
  portId: z.string().trim().min(1, 'Vui lòng nhập mã cảng.'),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface ProviderFormModalProps {
  isOpen: boolean;
  provider?: TourProvider | null;
  onClose: () => void;
  onSuccess?: (provider: TourProvider) => void;
}

interface ToastMessage {
  text: string;
  isError: boolean;
}

function getDefaultValues(provider?: TourProvider | null): ProviderFormValues {
  return {
    name: provider?.name ?? '',
    taxCode: provider?.taxCode ?? '',
    licenseNumber: provider?.licenseNumber ?? '',
    email: provider?.email ?? '',
    emergencyHotline: provider?.emergencyHotline ?? '',
    portId: provider?.portId ?? '',
  };
}

function getBackendErrorMessage(error: unknown): string | null {
  if (!isRecord(error) || !isRecord(error.response)) return null;

  const { status, data } = error.response;
  if (status !== 400 && status !== 409) return null;
  if (typeof data === 'string' && data.trim()) return data;
  if (!isRecord(data)) return null;

  for (const key of ['message', 'detail', 'error']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
  return getBackendErrorMessage(error) ??
    (error instanceof Error && error.message
      ? error.message
      : 'Không thể lưu thông tin nhà cung cấp. Vui lòng thử lại.');
}

const inputClassName =
  'w-full rounded-xl border border-[#D8D2C7] bg-white px-3.5 py-2.5 text-sm text-[#102A43] outline-none transition placeholder:text-[#9AA3AC] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15';
const labelClassName = 'mb-1.5 block text-sm font-medium text-[#334E68]';

export function ProviderFormModal({
  isOpen,
  provider,
  onClose,
  onSuccess,
}: ProviderFormModalProps) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: getDefaultValues(provider),
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) reset(getDefaultValues(provider));
  }, [isOpen, provider, reset]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const submitProvider = async (values: ProviderFormValues) => {
    let savedProvider: TourProvider;
    try {
      savedProvider = provider
        ? await updateTourProvider(provider.id, values)
        : await createTourProvider(values);
    } catch (error: unknown) {
      setToast({ text: getErrorMessage(error), isError: true });
      return;
    }

    setToast({
      text: provider
        ? 'Cập nhật nhà cung cấp thành công.'
        : 'Thêm nhà cung cấp thành công.',
      isError: false,
    });
    onSuccess?.(savedProvider);
    onClose();
  };

  return (
    <>
      {toast && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-[60] flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-white shadow-xl ${
            toast.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.isError ? (
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0B1F33]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-form-title"
        >
          <section className="relative my-auto w-full max-w-2xl rounded-2xl border border-[#E5E0D7] bg-white p-6 text-[#252B32] shadow-xl sm:p-7">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#5A6578] transition-colors hover:bg-[#F7F4ED] hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 border-b border-[#E5E0D7] pb-4 pr-8">
              <h2
                id="provider-form-title"
                className="text-lg font-bold text-[#102A43]"
              >
                {provider ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
              </h2>
              <p className="mt-1 text-sm text-[#687787]">
                Nhập thông tin đối tác và cảng hoạt động.
              </p>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit(submitProvider)}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="provider-name" className={labelClassName}>
                    Tên đối tác <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="provider-name"
                    autoComplete="organization"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'provider-name-error' : undefined}
                    className={inputClassName}
                    placeholder="Nhập tên đối tác"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="provider-name-error" role="alert" className="mt-1 text-xs text-rose-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="provider-tax-code" className={labelClassName}>
                    Mã số thuế
                  </label>
                  <input
                    id="provider-tax-code"
                    aria-invalid={Boolean(errors.taxCode)}
                    className={inputClassName}
                    placeholder="Nhập mã số thuế"
                    {...register('taxCode')}
                  />
                </div>

                <div>
                  <label htmlFor="provider-license-number" className={labelClassName}>
                    Giấy phép
                  </label>
                  <input
                    id="provider-license-number"
                    aria-invalid={Boolean(errors.licenseNumber)}
                    className={inputClassName}
                    placeholder="Nhập số giấy phép"
                    {...register('licenseNumber')}
                  />
                </div>

                <div>
                  <label htmlFor="provider-email" className={labelClassName}>
                    Email
                  </label>
                  <input
                    id="provider-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'provider-email-error' : undefined}
                    className={inputClassName}
                    placeholder="name@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="provider-email-error" role="alert" className="mt-1 text-xs text-rose-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="provider-emergency-hotline" className={labelClassName}>
                    Hotline khẩn cấp <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="provider-emergency-hotline"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.emergencyHotline)}
                    aria-describedby={
                      errors.emergencyHotline ? 'provider-emergency-hotline-error' : undefined
                    }
                    className={inputClassName}
                    placeholder="Nhập số hotline"
                    {...register('emergencyHotline')}
                  />
                  {errors.emergencyHotline && (
                    <p
                      id="provider-emergency-hotline-error"
                      role="alert"
                      className="mt-1 text-xs text-rose-600"
                    >
                      {errors.emergencyHotline.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="provider-port-id" className={labelClassName}>
                    Địa chỉ cảng (Mã cảng) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="provider-port-id"
                    aria-invalid={Boolean(errors.portId)}
                    aria-describedby={errors.portId ? 'provider-port-id-error' : undefined}
                    className={inputClassName}
                    placeholder="Ví dụ: VN-HAN"
                    {...register('portId')}
                  />
                  {errors.portId && (
                    <p id="provider-port-id-error" role="alert" className="mt-1 text-xs text-rose-600">
                      {errors.portId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E0D7] pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[#D8D2C7] px-4 py-2.5 text-sm font-semibold text-[#334E68] transition hover:bg-[#F7F4ED] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B3A57] disabled:cursor-wait disabled:opacity-60"
                >
                  <Save aria-hidden="true" className="h-4 w-4" />
                  {isSubmitting ? 'Đang lưu...' : 'Save'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}