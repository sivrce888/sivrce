import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-extrabold whitespace-nowrap transition-all duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-sv-blue text-white shadow-glow-blue hover:bg-sv-blue-deep",
        action:
          "bg-sv-orange text-white shadow-glow-orange hover:-translate-y-0.5 hover:shadow-glow-orange-lg active:scale-[0.98]",
        outline:
          "border border-sv-ink/10 bg-sv-surface text-sv-ink hover:border-sv-blue/50 hover:text-sv-blue",
        ghost: "text-sv-ink hover:bg-sv-ink/5",
        link: "text-sv-blue underline-offset-4 hover:text-sv-blue-deep hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
