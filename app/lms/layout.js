import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "../../lms/app/globals.css";
import "../../lms/runtime/runtime.css";

const lmsSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lms-sans"
});

const lmsSerif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-lms-serif"
});

export const metadata = {
  title: "WeAreAiLabs LMS",
  description: "Explore. Learn. Create. Together."
};

export default function LMSLayout({ children }) {
  return (
    <div className={`lms-root ${lmsSans.variable} ${lmsSerif.variable}`}>
      {children}
    </div>
  );
}
