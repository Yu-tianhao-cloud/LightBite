import type { CompanionMood } from "./companionMessages";

type PotatoCharacterProps = {
  mood: CompanionMood;
  isDragging: boolean;
  isSpeaking: boolean;
};

function Eyes({ mood }: { mood: CompanionMood }) {
  if (mood === "happy") {
    return (
      <g className="potato-eyes potato-eyes-happy">
        <path d="M83 88 Q91 96 100 88" />
        <path d="M142 88 Q151 96 160 88" />
      </g>
    );
  }

  if (mood === "sleepy") {
    return (
      <g className="potato-eyes potato-eyes-sleepy">
        <path d="M82 91 Q91 87 101 91" />
        <path d="M141 91 Q151 87 161 91" />
      </g>
    );
  }

  if (mood === "surprised" || mood === "dragging") {
    return (
      <g className="potato-eyes">
        <circle cx="91" cy="88" r="9.5" />
        <circle cx="151" cy="88" r="9.5" />
        <circle cx="88" cy="84" r="2.2" fill="#fff" />
        <circle cx="148" cy="84" r="2.2" fill="#fff" />
      </g>
    );
  }

  if (mood === "thinking" || mood === "curious") {
    return (
      <g className="potato-eyes potato-eyes-curious">
        <circle cx="88" cy="88" r="7.5" />
        <circle cx="148" cy="88" r="7.5" />
        <circle cx="85" cy="85" r="2" fill="#fff" />
        <circle cx="145" cy="85" r="2" fill="#fff" />
      </g>
    );
  }

  return (
    <g className="potato-eyes">
      <circle cx="91" cy="88" r="7.5" />
      <circle cx="151" cy="88" r="7.5" />
      <circle cx="88.5" cy="85" r="2" fill="#fff" />
      <circle cx="148.5" cy="85" r="2" fill="#fff" />
    </g>
  );
}

function Mouth({ mood, isSpeaking }: { mood: CompanionMood; isSpeaking: boolean }) {
  if (mood === "surprised" || mood === "dragging") {
    return <ellipse cx="121" cy="111" rx="7" ry="9" fill="#6f4228" className="potato-mouth" />;
  }

  if (mood === "sleepy") {
    return <path className="potato-mouth-line" d="M113 111 Q121 115 129 111" />;
  }

  if (isSpeaking || mood === "talking") {
    return <path className="potato-mouth-talk" d="M111 108 Q121 121 132 108 Q121 116 111 108Z" />;
  }

  if (mood === "happy") {
    return <path className="potato-mouth-line" d="M108 107 Q121 121 135 107" />;
  }

  return <path className="potato-mouth-line" d="M112 108 Q121 116 130 108" />;
}

export default function PotatoCharacter({ mood, isDragging, isSpeaking }: PotatoCharacterProps) {
  const activeMood = isDragging ? "dragging" : mood;

  return (
    <div
      className={`potato-shell potato-shell-${activeMood} ${isDragging ? "potato-dragging" : ""} ${
        isSpeaking ? "potato-speaking" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 170" role="img" className="potato-svg">
        <defs>
          <radialGradient id="potato-highlight" cx="34%" cy="24%" r="74%">
            <stop offset="0%" stopColor="#f3d49a" />
            <stop offset="38%" stopColor="#d8aa6b" />
            <stop offset="76%" stopColor="#bd8652" />
            <stop offset="100%" stopColor="#9f6842" />
          </radialGradient>
          <linearGradient id="potato-side" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#efd197" stopOpacity="0.78" />
            <stop offset="55%" stopColor="#c89158" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7f4f32" stopOpacity="0.24" />
          </linearGradient>
          <filter id="potato-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#73431f" floodOpacity="0.22" />
          </filter>
          <filter id="potato-inner-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
            <feOffset dx="0" dy="1" />
            <feComposite operator="out" in2="SourceAlpha" />
          </filter>
        </defs>

        <ellipse className="potato-ground-shadow" cx="119" cy="148" rx="70" ry="13" />

        <g className="potato-body-group" filter="url(#potato-soft-shadow)">
          <path
            className="potato-limb potato-arm-left"
            d="M43 105 C25 102 20 114 27 124 C35 135 51 128 56 114"
          />
          <path
            className="potato-limb potato-arm-right"
            d="M196 104 C215 100 221 113 214 124 C206 136 190 128 184 114"
          />
          <ellipse className="potato-foot potato-foot-left" cx="83" cy="137" rx="18" ry="10" />
          <ellipse className="potato-foot potato-foot-right" cx="150" cy="138" rx="18" ry="10" />

          <path
            className="potato-body"
            d="M34 93 C30 63 52 38 84 30 C112 23 143 26 170 36 C197 46 217 68 214 98 C211 128 184 143 147 147 C111 151 73 148 51 130 C40 121 36 108 34 93Z"
          />
          <path
            className="potato-body-overlay"
            d="M43 87 C42 62 61 44 88 37 C115 30 144 33 168 43 C190 52 205 70 204 95 C202 120 179 134 146 138 C112 142 77 140 57 125 C47 117 44 103 43 87Z"
          />

          <g className="potato-spots" opacity="0.58">
            <ellipse cx="67" cy="76" rx="4.2" ry="2.8" transform="rotate(-19 67 76)" />
            <ellipse cx="82" cy="119" rx="3.3" ry="2.3" transform="rotate(18 82 119)" />
            <ellipse cx="105" cy="54" rx="3.4" ry="2.2" transform="rotate(-8 105 54)" />
            <ellipse cx="128" cy="132" rx="4" ry="2.6" transform="rotate(-16 128 132)" />
            <ellipse cx="169" cy="72" rx="3.8" ry="2.5" transform="rotate(24 169 72)" />
            <ellipse cx="182" cy="113" rx="3.4" ry="2.1" transform="rotate(-21 182 113)" />
            <ellipse cx="54" cy="103" rx="2.7" ry="1.9" transform="rotate(12 54 103)" />
            <ellipse cx="146" cy="51" rx="2.6" ry="1.8" transform="rotate(16 146 51)" />
            <ellipse cx="114" cy="124" rx="2.2" ry="1.6" transform="rotate(-20 114 124)" />
          </g>

          <ellipse className="potato-blush potato-blush-left" cx="72" cy="110" rx="12" ry="6" />
          <ellipse className="potato-blush potato-blush-right" cx="169" cy="110" rx="12" ry="6" />

          <Eyes mood={activeMood} />
          <Mouth mood={activeMood} isSpeaking={isSpeaking} />

          <g className="potato-sparkles">
            <path d="M49 48 L53 57 L62 61 L53 65 L49 74 L45 65 L36 61 L45 57Z" />
            <path d="M193 39 L196 46 L203 49 L196 52 L193 59 L190 52 L183 49 L190 46Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
