// Shimmer placeholder for loading states. Uses the global .hai-skel animation
// (defined in layout) which is disabled under prefers-reduced-motion.
export default function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  return (
    <span
      className="hai-skel"
      aria-hidden
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}
