import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_ELEMENTS_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function useModalFocusTrap({
  isOpen,
  containerRef,
  onClose,
}: UseModalFocusTrapOptions): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      if (containerRef.current) {
        const focusableNodes = containerRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENTS_SELECTOR
        );
        if (focusableNodes.length > 0) {
          focusableNodes[0].focus();
        }
      }
    }, 0);

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && containerRef.current) {
        const focusableNodes = containerRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENTS_SELECTOR
        );
        if (focusableNodes.length === 0) return;

        const firstNode = focusableNodes[0];
        const lastNode = focusableNodes[focusableNodes.length - 1];

        if (event.shiftKey && document.activeElement === firstNode) {
          event.preventDefault();
          lastNode.focus();
        } else if (!event.shiftKey && document.activeElement === lastNode) {
          event.preventDefault();
          firstNode.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeydown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeydown);
      if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
        previousFocusedElement.focus();
      }
    };
  }, [isOpen, containerRef]);
}
