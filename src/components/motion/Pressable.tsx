import { m, type HTMLMotionProps } from "motion/react";

import { SPRING } from "../../lib/motion";

/** `press`: a button that dips to 97% on tap and springs back. */
export default function Pressable({ children, ...props }: HTMLMotionProps<"button">) {
  return (
    <m.button type="button" whileTap={{ scale: 0.97 }} transition={SPRING.snappy} {...props}>
      {children}
    </m.button>
  );
}
