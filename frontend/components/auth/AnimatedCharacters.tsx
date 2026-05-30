// frontend/components/auth/AnimatedCharacters.tsx
import { useState, useRef, useEffect } from "react";

// ================================================================
//    Types
// ================================================================

// normal     = idle, eyes follow mouse
// email      = email input focused → slight right tilt, eyes look right
// password   = password input focused → more right tilt, eyes look right/shy
// revealed   = password eye toggled → hard left tilt, eyes locked left

type FocusState = "normal" | "email" | "password" | "revealed";

// ================================================================
//    Characters config — all share same bottom
// ================================================================

interface CharacterConfig {
  id: string;
  color: string;
  colorLight: string;
  bodyClass: string;
  left: string;
  eyeTop: number;
  delay: number;
}

const CHARACTER_BOTTOM = "20%";

const CHARACTERS: CharacterConfig[] = [
  { id: "sprout", color: "#4a7c59", colorLight: "#7db892", bodyClass: "tall",  left: "12%", eyeTop: 28, delay: 0   },
  { id: "tomato", color: "#e94560", colorLight: "#f27b8e", bodyClass: "round", left: "30%", eyeTop: 18, delay: 0.3 },
  { id: "carrot", color: "#f39c12", colorLight: "#f7b84c", bodyClass: "slim",  left: "58%", eyeTop: 26, delay: 0.6 },
  { id: "egg",    color: "#8B7355", colorLight: "#c4a97d", bodyClass: "short", left: "71%", eyeTop: 15, delay: 0.9 },
];

// ================================================================
//    Animated Characters (parent)
// ================================================================

interface Props {
  focusState: FocusState;
}

export default function AnimatedCharacters({ focusState }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: -9999, y: -9999 });
  const prevState = useRef<FocusState>("normal");

  // When entering "revealed", freeze mouse tracking
  const locked = focusState === "revealed";

  // Global mouse tracking — works across the entire page, not just left panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (locked) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMouseOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [locked]);

  useEffect(() => {
    prevState.current = focusState;
  }, [focusState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-green-50 via-green-100/50 to-amber-50/30"
    >
      {/* Decorative blobs */}
      <div className="absolute top-[15%] left-[25%] w-32 h-32 bg-green-200/30 rounded-full blur-2xl" />
      <div className="absolute bottom-[20%] right-[20%] w-40 h-40 bg-amber-100/40 rounded-full blur-3xl" />
      <div className="absolute top-[50%] left-[55%] w-24 h-24 bg-red-100/30 rounded-full blur-2xl" />

      {/* Floor — all characters stand on this */}
      <div
        className="absolute left-0 right-0 bg-gradient-to-t from-green-200/40 to-transparent rounded-t-[60%]"
        style={{ bottom: 0, height: "20%", transform: "translateY(40%)" }}
      />

      {/* Characters */}
      {CHARACTERS.map((char) => (
        <Character
          key={char.id}
          config={char}
          mouseOffset={mouseOffset}
          focusState={focusState}
          locked={locked}
        />
      ))}

      {/* Title */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <p className="text-primary/60 text-xs tracking-widest font-semibold">LIGHTBITE</p>
        <p className="text-primary/40 text-[11px] mt-1">精准到克的健康饮食</p>
      </div>
    </div>
  );
}

// ================================================================
//    Single Character
// ================================================================

function Character({
  config,
  mouseOffset,
  focusState,
  locked,
}: {
  config: CharacterConfig;
  mouseOffset: { x: number; y: number };
  focusState: FocusState;
  locked: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [blinking, setBlinking] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const blinkTick = useRef(0);

  // Track body center for eye-mouse math
  useEffect(() => {
    const update = () => {
      const el = bodyRef.current;
      const container = el?.parentElement;
      if (!el || !container) return;
      const r = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      setCenter({ x: r.left + r.width / 2 - cr.left, y: r.top + config.eyeTop - cr.top });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [config.eyeTop]);

  // Blinking
  useEffect(() => {
    const doBlink = () => { setBlinking(true); setTimeout(() => setBlinking(false), 150); };
    const initial = setTimeout(doBlink, config.delay * 1000 + 500);
    const interval = setInterval(() => {
      blinkTick.current += 1;
      if (blinkTick.current % 3 === 0) doBlink();
    }, 1500 + Math.random() * 2000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [config.delay]);

  // ---- Rotation based on focusState ----
  const getRotation = (): string => {
    switch (focusState) {
      case "email":    return "rotateY(32deg)";
      case "password": return "rotateY(25deg)";
      case "revealed": return "rotateY(-18deg)";
      default:         return "rotateY(0deg)";
    }
  };

  // ---- Eye target direction ----
  // email/password: eyes look right (toward the form side)
  // revealed: eyes look left
  // normal: eyes follow mouse
  const getEyeDir = (): { x: number; y: number } | null => {
    if (locked) return { x: -20, y: -1 };          // hard left, locked
    if (focusState === "password") return { x: 25, y: -2 };  // shy right
    if (focusState === "email")    return { x: 12, y: -1 };  // slight right
    return null; // follow mouse
  };

  const eyeDir = getEyeDir();

  // Calculate pupil offset
  let ox: number, oy: number;
  if (eyeDir) {
    ox = eyeDir.x;
    oy = eyeDir.y;
  } else {
    const dx = mouseOffset.x - center.x;
    const dy = mouseOffset.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = 3.2;
    const r = Math.min(dist / 160, 1) * maxR;
    ox = dist > 0 ? (dx / dist) * r : 0;
    oy = dist > 0 ? (dy / dist) * r : 0;
  }

  const shySquint = focusState === "password";
  const eyeGap = config.bodyClass === "slim" ? 16 : config.bodyClass === "tall" ? 20 : 22;
  const eyeW = config.bodyClass === "slim" ? "16px" : "20px";
  const eyeH = config.bodyClass === "slim" ? "20px" : "24px";
  const pupilW = config.bodyClass === "slim" ? "7px" : "8px";
  const pupilH = config.bodyClass === "slim" ? "10px" : "11px";

  const bodyStyles: Record<string, React.CSSProperties> = {
    tall:  { width: "100px",  height: "280px", borderRadius: "50px", background: `linear-gradient(180deg, ${config.colorLight} 0%, ${config.color} 100%)` },
    round: { width: "160px", height: "160px", borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, ${config.colorLight} 0%, ${config.color} 100%)` },
    slim:  { width: "80px",  height: "220px", borderRadius: "40px", background: `linear-gradient(180deg, ${config.colorLight} 0%, ${config.color} 100%)` },
    short: { width: "168px",  height: "100px",  borderRadius: "64px", background: `radial-gradient(ellipse at 50% 30%, ${config.colorLight} 0%, ${config.color} 100%)` },
  };

  return (
    <div
      ref={bodyRef}
      className="absolute"
      style={{
        left: config.left,
        bottom: CHARACTER_BOTTOM,
        ...bodyStyles[config.bodyClass],
        transform: getRotation(),
        boxShadow: `0 8px 24px ${config.color}30, inset 0 -4px 8px ${config.color}20`,
        transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        perspective: "200px",
      }}
    >
      {/* Blush */}
      {config.bodyClass !== "slim" && (
        <>
          <div className="absolute rounded-full opacity-40"
            style={{ width: "14px", height: "8px", background: config.bodyClass === "round" ? "#ff9999" : "#ffaaaa", top: `${config.eyeTop + 20}px`, left: "18%" }} />
          <div className="absolute rounded-full opacity-40"
            style={{ width: "14px", height: "8px", background: config.bodyClass === "round" ? "#ff9999" : "#ffaaaa", top: `${config.eyeTop + 20}px`, right: "18%" }} />
        </>
      )}

      {/* Mouth */}
      <div className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: `${config.eyeTop + (config.bodyClass === "short" ? 18 : 26)}px`,
          width: config.bodyClass === "slim" ? "30px" : "36px",
          height: config.bodyClass === "round" ? "8px" : "20px",
          borderBottom: "5px solid #333",
          borderBottomLeftRadius: "50%", borderBottomRightRadius: "50%",
          opacity: focusState === "password" ? 0.3 : focusState === "revealed" ? 0.5 : 0.7,
        }}
      />

      {/* Eyes */}
      <div className={`${blinking ? "opacity-40" : "opacity-100"} transition-opacity duration-75`}>
        <div className="absolute left-1/2 flex"
          style={{ top: `${config.eyeTop}px`, transform: "translateX(-50%)", gap: `${eyeGap}px` }}>
          {[0, 1].map((i) => (
            <div key={i} className="relative bg-white rounded-full"
              style={{
                width: eyeW, height: eyeH,
                transform: shySquint ? "scaleY(0.3)" : "scaleY(1)",
                transition: "transform 0.3s ease",
              }}>
              {/* Pupil */}
              <div className="absolute bg-gray-800 rounded-full"
                style={{
                  width: pupilW, height: pupilH, left: "50%",
                  top: shySquint ? "60%" : "45%",
                  transform: `translate(-50%, -50%) translate(${shySquint ? (i === 0 ? -5 : 5) : ox}px, ${shySquint ? -2 : oy}px)`,
                  transition: locked ? "transform 0.5s ease" : shySquint ? "transform 0.3s ease" : "transform 0.08s ease-out",
                }} />
              {/* Eye shine */}
              <div className="absolute bg-white rounded-full"
                style={{
                  width: "3px", height: "3px", left: "60%",
                  top: shySquint ? "55%" : "25%",
                  opacity: shySquint ? 0 : 0.8,
                  transition: "opacity 0.3s",
                }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
