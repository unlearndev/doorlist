// A grey block that stands in for something while it loads.
export function Placeholder({ width, height = 28 }: { width?: number; height?: number }) {
  return <span className="placeholder" style={{ width: width ?? "100%", height }} aria-label="Loading" />;
}
