import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

function Dialog(props) {
  return <DialogPrimitive.Root {...props} />
}

function DialogTrigger(props) {
  return <DialogPrimitive.Trigger {...props} />
}

function DialogBackdrop({ className, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-150",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "bg-background rounded-2xl border border-border shadow-2xl",
          "w-full max-w-sm p-6 outline-none",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
          "transition-all duration-150",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 mb-5", className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }) {
  return (
    <div className={cn("flex justify-end gap-2 mt-5", className)} {...props} />
  )
}

function DialogClose(props) {
  return <DialogPrimitive.Close {...props} />
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
