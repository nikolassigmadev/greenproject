// Height animation with no measuring.
//
// The obvious implementations both have a sting. `max-height` makes you guess a
// ceiling, and the easing goes wrong whenever the guess is too generous.
// Measuring `scrollHeight` in an effect works right up until the effect re-runs
// mid-transition and strands the element at full height — which is exactly what
// happened here: a closed panel sat at 297px and left a dead gap down the page.
//
// `grid-template-rows: 0fr -> 1fr` is animatable and needs neither. The browser
// interpolates the track size against the content's real height, so it is
// always the right distance and it keeps working when the content changes size.
// The child needs `min-height: 0` or the implicit minimum keeps it open.
//
// Where the property isn't supported this degrades to an instant show/hide,
// which is a fine outcome for a disclosure.
//
// Collapsed content is taken out of the tab order and hidden from assistive
// tech, so a closed panel isn't a trap for anyone not using a mouse.

interface Props {
  open: boolean;
  children: React.ReactNode;
  /** ms — matched to the chevron rotation on the trigger. */
  duration?: number;
}

export function Collapse({ open, children, duration = 260 }: Props) {
  return (
    <div
      aria-hidden={!open}
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        opacity: open ? 1 : 0,
        transition:
          `grid-template-rows ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), ` +
          `opacity ${Math.round(duration * 0.75)}ms ease`,
      }}
    >
      <div
        style={{ overflow: 'hidden', minHeight: 0 }}
        {...(open ? {} : { inert: '' as unknown as boolean })}
      >
        {children}
      </div>
    </div>
  );
}
