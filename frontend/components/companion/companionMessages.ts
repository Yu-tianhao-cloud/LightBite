export type CompanionMood =
  | "idle"
  | "happy"
  | "talking"
  | "curious"
  | "sleepy"
  | "surprised"
  | "dragging"
  | "thinking";

type MessageKind = "greeting" | "click" | "idle" | "sleepy" | "drag";

type RouteMessages = {
  patterns: string[];
  messages: string[];
};

const GENERAL_MESSAGES: Record<MessageKind, string[]> = {
  greeting: [
    "嘿，我是小薯，今天也在这儿陪你。",
    "我在右下角趴好啦，有事就戳戳我。",
    "慢慢来就很好，我们一起好好吃饭。",
  ],
  click: [
    "嘿嘿，我在！",
    "你戳到一颗认真营业的土豆。",
    "今天也要好好吃饭呀。",
    "别急，我们一步一步来。",
    "土豆也可以很轻盈，真的。",
    "我刚刚弹了一下，你看到没？",
  ],
  idle: [
    "我刚刚在想，晚餐要不要简单一点。",
    "你忙你的，我在这里安静趴着。",
    "要不要看看今天有什么好吃的？",
    "记录一餐也很棒，不用追求完美。",
    "我没有偷懒，我是在进行土豆式思考。",
  ],
  sleepy: [
    "我先趴一会儿……叫我就醒。",
    "有点困，但我还在陪你。",
    "小薯进入省电模式。",
  ],
  drag: [
    "哎呀，我被搬家啦。",
    "这个位置也不错，我先趴这儿。",
    "收到，新家已保存。",
  ],
};

const ROUTE_MESSAGES: RouteMessages[] = [
  {
    patterns: ["/"],
    messages: [
      "想找什么菜？我帮你盯着搜索框。",
      "今天适合找一道轻松点的菜。",
      "输入食材试试，说不定有惊喜。",
    ],
  },
  {
    patterns: ["/recipe/[id]"],
    messages: [
      "这道菜看起来挺香的，营养信息也别忘了看。",
      "喜欢的话，可以把它安排进计划里。",
      "我负责陪看，你负责决定吃不吃。",
    ],
  },
  {
    patterns: ["/dashboard"],
    messages: [
      "你的记录我有看到哦，慢慢来就很好。",
      "趋势不是用来焦虑的，是用来了解自己的。",
      "坚持记录这件事，本身就很厉害。",
    ],
  },
  {
    patterns: ["/log"],
    messages: [
      "今天吃了什么？记一点点也可以。",
      "不用记得完美，愿意开始就很好。",
      "小薯陪你把今天的一餐放进记录里。",
    ],
  },
  {
    patterns: ["/plan"],
    messages: [
      "我们可以先安排一天，不用一下子规划太多。",
      "计划是帮你的，不是管你的。",
      "今天的小目标：吃得舒服一点。",
    ],
  },
  {
    patterns: ["/shopping"],
    messages: [
      "购物清单在手，少买漏买。",
      "买菜前看一眼清单，小薯觉得很稳。",
      "别忘了给自己留点喜欢吃的。",
    ],
  },
  {
    patterns: ["/roulette"],
    messages: [
      "选择困难的时候，就让转盘帮一下忙。",
      "我也想知道今天会转到什么。",
      "随机一下，说不定刚好就是想吃的。",
    ],
  },
  {
    patterns: ["/chat"],
    messages: [
      "你们聊，我在旁边认真旁听。",
      "如果想不到吃什么，也可以问问看。",
      "小薯负责陪聊气氛组。",
    ],
  },
  {
    patterns: ["/login"],
    messages: [
      "欢迎回来，我等你好久啦。",
      "登录后，我就能继续陪你记录饮食啦。",
    ],
  },
  {
    patterns: ["/register"],
    messages: [
      "新朋友！我叫小薯。",
      "欢迎加入 LightBite，我们慢慢开始就好。",
    ],
  },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getCompanionMessage(pathname: string, kind: MessageKind = "click") {
  const route = ROUTE_MESSAGES.find((item) => item.patterns.includes(pathname));
  const pool = kind === "click" && route ? [...route.messages, ...GENERAL_MESSAGES.click] : GENERAL_MESSAGES[kind];
  return pick(pool);
}

export function moodForMessageKind(kind: MessageKind): CompanionMood {
  if (kind === "sleepy") return "sleepy";
  if (kind === "idle") return "curious";
  if (kind === "drag") return "surprised";
  if (kind === "greeting") return "happy";
  return "happy";
}
