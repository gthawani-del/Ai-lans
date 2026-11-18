import "../../lms/app/globals.css";
import "../../lms/runtime/runtime.css";

export const metadata = {
  title: "WeAreAiLabs LMS",
  description: "Explore. Learn. Create. Together."
};

export default function LMSLayout({ children }) {
  return (
    <div
      className="lms-root"
      style={{
        "--font-lms-sans": "system-ui, -apple-system, Segoe UI, sans-serif",
        "--font-lms-serif": "Georgia, serif"
      }}
    >
      {children}
    </div>
  );
}
