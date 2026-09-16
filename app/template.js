// CSS animation keeps SSR content readable even without JavaScript.
export default function Template({ children }) {
  return <div className="route-reveal">{children}</div>;
}
