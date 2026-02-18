import * as React from "react";

type RechartsModule = typeof import("recharts");

export function useRecharts() {
  const [mod, setMod] = React.useState<RechartsModule | null>(null);

  React.useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((m) => mounted && setMod(m))
      .catch(() => mounted && setMod(null));
    return () => {
      mounted = false;
    };
  }, []);

  return mod;
}

export type { RechartsModule };
