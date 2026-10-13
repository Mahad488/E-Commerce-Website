import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  // Scroll to top upon navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
      
      setVisible(totalScroll > 320);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Scroll Progress Bar at the very top of the window */}
      <div
        className="scroll-progress-bar"
        style={{
          // Fallback width for browsers without CSS animation-timeline: scroll()
          width: `${scrollProgress}%`,
        }}
      />

      {/* Floating Scroll to Top Action Button */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-90 pointer-events-none"
        }`}
      >
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top of page"
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white shadow-xl hover:bg-orange-600 hover:shadow-orange-500/25 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <ArrowUp
            size={20}
            className="transition-transform duration-300 group-hover:-translate-y-1"
          />
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full border border-orange-400 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
        </button>
      </div>
    </>
  );
}
