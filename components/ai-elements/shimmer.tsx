"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  type CSSProperties,
  type ElementType,
  type JSX,
  memo,
  useMemo,
} from "react";

type TextShimmerProps = {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  duration?: number;
  spread?: number;
  dir?: "ltr" | "rtl";
};

export const ShimmerComponent = ({
                                   children,
                                   as: Component = "p",
                                   className,
                                   duration = 2,
                                   spread = 2,
                                   dir = "rtl",
                                 }: TextShimmerProps) => {
  const MotionComponent = motion.create(
      Component as keyof JSX.IntrinsicElements
  );

  const dynamicSpread = useMemo(
      () => (children?.length ?? 0) * spread,
      [children, spread]
  );

  const isRtl = dir === "rtl";

  return (
      <MotionComponent
          initial={{ backgroundPosition: isRtl ? "0% center" : "100% center" }}
          animate={{ backgroundPosition: isRtl ? "100% center" : "0% center" }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration,
            ease: "linear",
          }}
          className={cn(
              "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
              "[--bg:linear-gradient(var(--angle),#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
              className
          )}
          style={
            {
              "--spread": `${dynamicSpread}px`,
              "--angle": isRtl ? "-90deg" : "90deg",
              backgroundImage:
                  "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
            } as CSSProperties
          }
          dir={dir}
      >
        {children}
      </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
