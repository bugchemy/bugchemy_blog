import * as React from "react";

import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";


const CardTitleWithTooltip: React.FC<{ text: string; limit?: number; className?: string }> = ({
  text,
  limit = 60,
  className,
}) => {
  if (!text) return null;
  const isTruncated = text.length > limit;
  const displayText = isTruncated ? text.slice(0, limit) + "…" : text;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>
            {displayText}
          </h3>
        </Tooltip.Trigger>
        {isTruncated && (
          <Tooltip.Portal>
            <Tooltip.Content className="bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100 text-sm p-2 rounded shadow-lg z-50 max-w-xs whitespace-normal">
              {text}
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

const CardDescriptionWithTooltip: React.FC<{ text: string; limit?: number; className?: string }> = ({
  text,
  limit = 100,
  className,
}) => {
  if (!text) return null;
  const isTruncated = text.length > limit;
  const displayText = isTruncated ? text.slice(0, limit) + "…" : text;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <p className={cn("text-sm text-muted-foreground", className)}>{displayText}</p>
        </Tooltip.Trigger>
        {isTruncated && (
          <Tooltip.Portal>
            <Tooltip.Content className="bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100 text-sm p-2 rounded shadow-lg z-50 max-w-xs whitespace-normal">
              {text}
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};


export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardTitleWithTooltip,
  CardDescriptionWithTooltip,
};
