import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      offset={92}
      duration={3000}
      visibleToasts={3}
      gap={8}
      className="goodscan-toaster"
      style={
        {
          // CSS custom properties so the icon background per variant looks right
          "--normal-bg": "var(--ds-card)",
          "--normal-text": "var(--ds-ink)",
          "--normal-border": "var(--ds-hair)",
          "--success-bg": "var(--ds-card)",
          "--success-text": "var(--ds-ink)",
          "--success-border": "color-mix(in srgb, var(--ds-good) 35%, transparent)",
          "--error-bg": "var(--ds-card)",
          "--error-text": "var(--ds-ink)",
          "--error-border": "color-mix(in srgb, var(--ds-bad) 35%, transparent)",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "goodscan-toast",
          title: "goodscan-toast-title",
          description: "goodscan-toast-desc",
          actionButton: "goodscan-toast-action",
          cancelButton: "goodscan-toast-cancel",
          success: "goodscan-toast-success",
          error: "goodscan-toast-error",
          icon: "goodscan-toast-icon",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
