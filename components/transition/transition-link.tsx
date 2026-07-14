"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { TEXT_LINK_CLASS, TextLinkContent } from "@/components/ui/text-link";
import { cn } from "@/lib/cn";
import { useTransitionRouter } from "./transition-provider";

export type TransitionLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
};

/**
 * Drop-in for `next/link` that plays the Draw SVG transition on internal
 * navigation. Falls back to native behavior for modified clicks, new tabs, and
 * external/protocol links, and keeps Next's prefetching (via the wrapped Link)
 * so the route commit — and therefore the reveal — lands fast.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink({ href, onClick, target, ...rest }, ref) {
    const { navigate } = useTransitionRouter();

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);
      // Bail to native <a> behavior for anything that isn't a plain left-click
      // on an in-app path: modified clicks, new tabs, and external/protocol
      // links (a `scheme:` prefix or protocol-relative `//host`).
      const external = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (target && target !== "_self") ||
        external
      ) {
        return;
      }
      event.preventDefault();
      navigate(href);
    }

    return (
      <Link ref={ref} href={href} target={target} onClick={handleClick} {...rest} />
    );
  }
);

/** Transition-aware navigation wearing the shared inline text-link primitive. */
export const TransitionTextLink = forwardRef<
  HTMLAnchorElement,
  TransitionLinkProps
>(function TransitionTextLink({ className, children, ...props }, ref) {
  return (
    <TransitionLink
      ref={ref}
      className={cn(TEXT_LINK_CLASS, className)}
      {...props}
    >
      <TextLinkContent>{children}</TextLinkContent>
    </TransitionLink>
  );
});
