import { useTheme } from "next-themes";

export function Logo({ size = 26 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? "/logo-icon-dark.png" : "/logo-icon.png";
  return <img src={src} alt="GoodScan" style={{ width: size, height: size }} />;
}
