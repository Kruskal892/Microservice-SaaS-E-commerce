'use client';

import type { ComponentProps } from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { cn } from '../../utils';

const Modal = Primitive.Root;
const ModalTrigger = Primitive.Trigger;
const ModalClose = Primitive.Close;

type ModalContentProps = ComponentProps<typeof Primitive.Content> & {
  overlayClassName?: string;
  container?: ComponentProps<typeof Primitive.Portal>['container'];
};

function ModalContent({
  className,
  overlayClassName,
  container,
  children,
  ...props
}: ModalContentProps) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Overlay
        className={cn('fixed inset-0 z-40 bg-overlay', overlayClassName)}
      />
      <Primitive.Content
        {...props}
        data-slot="modal-content"
        className={cn(
          'fixed start-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2.5rem)] w-[calc(100%-2.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto overscroll-contain rounded-md border border-border bg-surface p-6 font-sans text-text shadow-overlay outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background tablet:p-8 rtl:translate-x-1/2',
          className,
        )}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
function ModalTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      {...props}
      className={cn(
        'text-2xl font-semibold text-balance break-words',
        className,
      )}
    />
  );
}
function ModalDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      {...props}
      className={cn('text-sm leading-5 break-words text-muted', className)}
    />
  );
}
function ModalFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn('flex flex-wrap justify-end gap-2', className)}
    />
  );
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalFooter,
};
export type { ModalContentProps };
