"use client";;
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import "@/components/ui/warcraftcn/styles/warcraft.css";

const TooltipVariantContext = React.createContext("default");

const tooltipContentVariants = cva(
  "fantasy z-50 w-fit max-w-xs rounded px-4 py-3 text-sm text-amber-100 wc-tooltip-base",
  {
    variants: {
      variant: {
        default: "wc-tooltip",
        uncommon: "wc-tooltip-uncommon",
        rare: "wc-tooltip-rare",
        epic: "wc-tooltip-epic",
        legendary: "wc-tooltip-legendary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const TOOLTIP_TITLE_COLORS = {
  default: "text-amber-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-orange-400",
};

function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return (<TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />);
}

function Tooltip({
  ...props
}) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}) {
  return (<TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />);
}

function TooltipContent({
  className,
  variant = "default",
  sideOffset = 8,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          tooltipContentVariants({ variant }),
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}>
        <TooltipVariantContext.Provider value={variant ?? "default"}>
          {children}
        </TooltipVariantContext.Provider>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

function TooltipTitle({
  className,
  ...props
}) {
  const variant = React.useContext(TooltipVariantContext);

  return (
    <p
      data-slot="tooltip-title"
      className={cn("font-bold", TOOLTIP_TITLE_COLORS[variant], className)}
      {...props} />
  );
}

function TooltipBody({
  className,
  ...props
}) {
  return (
    <p
      data-slot="tooltip-body"
      className={cn("mt-1 text-xs text-amber-100/80", className)}
      {...props} />
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipTitle,
  TooltipBody,
  TooltipProvider,
  tooltipContentVariants,
};
