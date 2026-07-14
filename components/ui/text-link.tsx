import { type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
export const TEXT_LINK_CLASS =
  "group relative inline-flex items-center rounded-xs font-medium text-lime transition-colors duration-300 ease-smooth before:absolute before:-inset-y-3 before:inset-x-0 before:content-[''] hover:text-cream focus-visible:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-olive-black";

export function TextLinkContent({ children }: { children: ReactNode }) {
  return (
    <span className="relative">
      {children}
      <span
        aria-hidden
        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-smooth group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </span>
  );
}


/** Inline text link with an animated underline that wipes in on hover/focus. */
export function TextLink({
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(TEXT_LINK_CLASS, className)} {...props}>
      <TextLinkContent>{children}</TextLinkContent>
    </a>
  );
}
