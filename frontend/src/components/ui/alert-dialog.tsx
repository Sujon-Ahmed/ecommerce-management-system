import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-sidebar/55" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-5 shadow-xl sm:p-6',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

export function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />
}

export function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export const AlertDialogCancel = AlertDialogPrimitive.Cancel
export const AlertDialogAction = AlertDialogPrimitive.Action
