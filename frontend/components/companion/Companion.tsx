import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import PotatoCharacter from "./PotatoCharacter";
import { CompanionMood, getCompanionMessage, moodForMessageKind } from "./companionMessages";

const STORAGE_KEY = "lightbite-potato-companion";
const FALLBACK_POSITION = { x: 24, y: 24 };
const BUBBLE_DURATION = 5200;
const IDLE_HINT_DELAY = 36000;
const SLEEPY_DELAY = 90000;
const DESKTOP_WIDTH = 128;
const MOBILE_WIDTH = 96;

type Position = {
  x: number;
  y: number;
};

type SavedState = {
  position?: Position;
  quiet?: boolean;
  hidden?: boolean;
};

type DragState = {
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeReadState(): SavedState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedState) : {};
  } catch {
    return {};
  }
}

function saveState(patch: SavedState) {
  if (typeof window === "undefined") return;

  const current = safeReadState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

function getCharacterWidth() {
  if (typeof window === "undefined") return DESKTOP_WIDTH;
  return window.innerWidth < 640 ? MOBILE_WIDTH : DESKTOP_WIDTH;
}

function getDefaultPosition() {
  if (typeof window === "undefined") return FALLBACK_POSITION;

  const width = getCharacterWidth();
  const height = width * 0.72;
  return {
    x: Math.max(14, window.innerWidth - width - 24),
    y: Math.max(14, window.innerHeight - height - 24),
  };
}

export default function Companion() {
  const router = useRouter();
  const [hasWindow, setHasWindow] = useState(false);
  const [position, setPosition] = useState<Position>(() => safeReadState().position ?? getDefaultPosition());
  const [mood, setMood] = useState<CompanionMood>("idle");
  const [message, setMessage] = useState("");
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [quiet, setQuiet] = useState(() => Boolean(safeReadState().quiet));
  const [hidden, setHidden] = useState(() => Boolean(safeReadState().hidden));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const characterWidth = hasWindow ? getCharacterWidth() : DESKTOP_WIDTH;

  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
  }, []);

  const clearIdleTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (sleepyTimerRef.current) clearTimeout(sleepyTimerRef.current);
    idleTimerRef.current = null;
    sleepyTimerRef.current = null;
  }, []);

  const say = useCallback(
    (text: string, nextMood: CompanionMood = "talking", duration = BUBBLE_DURATION) => {
      clearBubbleTimer();
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);

      setMessage(text);
      setMood(nextMood);
      setIsBubbleOpen(true);

      bubbleTimerRef.current = setTimeout(() => {
        setIsBubbleOpen(false);
        setMood((current) => (current === "sleepy" ? "sleepy" : "idle"));
      }, duration);

      moodTimerRef.current = setTimeout(() => {
        setMood((current) => (current === "sleepy" ? "sleepy" : "idle"));
      }, Math.min(2600, duration));
    },
    [clearBubbleTimer]
  );

  const resetIdleTimers = useCallback(() => {
    clearIdleTimers();
    if (quiet || hidden || isDragging) return;

    idleTimerRef.current = setTimeout(() => {
      const text = getCompanionMessage(router.pathname, "idle");
      say(text, moodForMessageKind("idle"));
    }, IDLE_HINT_DELAY);

    sleepyTimerRef.current = setTimeout(() => {
      const text = getCompanionMessage(router.pathname, "sleepy");
      say(text, "sleepy", 7000);
    }, SLEEPY_DELAY);
  }, [clearIdleTimers, hidden, isDragging, quiet, router.pathname, say]);

  useEffect(() => {
    window.setTimeout(() => setHasWindow(true), 0);
  }, []);

  useEffect(() => {
    if (!hasWindow || hidden || quiet) return;

    const timer = setTimeout(() => {
      say(getCompanionMessage(router.pathname, "greeting"), moodForMessageKind("greeting"), 4600);
    }, 900);

    return () => clearTimeout(timer);
  }, [hidden, hasWindow, quiet, router.pathname, say]);

  useEffect(() => {
    if (!hasWindow) return;

    const handleActivity = () => {
      if (mood === "sleepy" && !hidden) setMood("surprised");
      resetIdleTimers();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });
    resetIdleTimers();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearIdleTimers();
    };
  }, [clearIdleTimers, hidden, mood, hasWindow, resetIdleTimers]);

  useEffect(() => {
    if (!hasWindow) return;

    const handleResize = () => {
      setPosition((current) => {
        const width = getCharacterWidth();
        const height = width * 0.72;
        const next = {
          x: clamp(current.x, 12, Math.max(12, window.innerWidth - width - 12)),
          y: clamp(current.y, 12, Math.max(12, window.innerHeight - height - 12)),
        };
        saveState({ position: next });
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasWindow]);

  useEffect(() => {
    return () => {
      clearBubbleTimer();
      clearIdleTimers();
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    };
  }, [clearBubbleTimer, clearIdleTimers]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!hasWindow) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: position.x,
      startY: position.y,
    };
    setIsDragging(true);
    setMood("dragging");
    setIsMenuOpen(false);
    clearBubbleTimer();
    setIsBubbleOpen(false);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || !hasWindow) return;

    const width = getCharacterWidth();
    const height = width * 0.72;
    const next = {
      x: clamp(dragRef.current.startX + event.clientX - dragRef.current.startPointerX, 10, window.innerWidth - width - 10),
      y: clamp(dragRef.current.startY + event.clientY - dragRef.current.startPointerY, 10, window.innerHeight - height - 10),
    };
    setPosition(next);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;

    const moved =
      Math.abs(event.clientX - dragRef.current.startPointerX) > 8 ||
      Math.abs(event.clientY - dragRef.current.startPointerY) > 8;

    dragRef.current = null;
    setIsDragging(false);
    saveState({ position });

    if (moved) {
      say(getCompanionMessage(router.pathname, "drag"), moodForMessageKind("drag"), 3600);
    } else {
      say(getCompanionMessage(router.pathname, "click"), moodForMessageKind("click"));
    }
    resetIdleTimers();
  };

  const handleToggleQuiet = () => {
    const next = !quiet;
    setQuiet(next);
    saveState({ quiet: next });
    setIsMenuOpen(false);
    if (next) {
      setIsBubbleOpen(false);
      setMood("sleepy");
    } else {
      say("我回来啦，这次会小声一点。", "happy", 3800);
    }
  };

  const handleResetPosition = () => {
    const next = getDefaultPosition();
    setPosition(next);
    saveState({ position: next });
    setIsMenuOpen(false);
    say("我回到右下角啦。", "happy", 3200);
  };

  const handleHide = () => {
    setHidden(true);
    saveState({ hidden: true });
  };

  const handleRestore = () => {
    setHidden(false);
    saveState({ hidden: false });
    setTimeout(() => say("小薯复活！", "happy", 3200), 50);
  };

  if (!hasWindow) return null;

  if (hidden) {
    return (
      <div className="potato-peek-wrap fixed bottom-6 right-0 z-50 select-none">
        <div className="potato-peek-bubble" role="status">
          hi 我在这里哦
        </div>
        <button
          type="button"
          className="potato-button potato-peek-button"
          aria-label="小薯藏在右侧。点击让小薯回来。"
          title="点击让小薯回来"
          onClick={handleRestore}
        >
          <PotatoCharacter mood="idle" isDragging={false} isSpeaking />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 select-none"
      style={{
        left: position.x,
        top: position.y,
        width: characterWidth,
      }}
    >
      {isBubbleOpen && (
        <div className="potato-bubble" role="status">
          <p>{message}</p>
          <button type="button" aria-label="关闭小薯对话" onClick={() => setIsBubbleOpen(false)}>
            ×
          </button>
        </div>
      )}

      {isMenuOpen && (
        <div className="potato-menu">
          <div className="mb-2 text-xs font-semibold text-amber-950">小薯设置</div>
          <button type="button" onClick={handleToggleQuiet}>
            {quiet ? "恢复主动提示" : "先别主动说话"}
          </button>
          <button type="button" onClick={handleResetPosition}>
            回到右下角
          </button>
          <button type="button" onClick={handleHide}>
            暂时藏起来
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="小薯，LightBite 的土豆陪伴小人。点击互动，拖拽移动。"
        title="小薯：点击互动，拖拽移动，双击打开设置"
        className="potato-button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          setIsDragging(false);
          setMood("idle");
        }}
        onDoubleClick={() => setIsMenuOpen((current) => !current)}
      >
        <PotatoCharacter mood={mood} isDragging={isDragging} isSpeaking={isBubbleOpen} />
      </button>
    </div>
  );
}
