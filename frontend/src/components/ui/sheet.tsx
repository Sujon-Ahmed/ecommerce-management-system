import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'
import { DialogOverlay } from '@/components/ui/dialog'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: 'left' | 'right'
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-3 top-3 rounded-sm p-1 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description
