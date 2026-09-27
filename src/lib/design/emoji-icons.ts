/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Design v5 "Calm" — emoji → Lucide icon
// ═══════════════════════════════════════════════════════════════════════
//  v5 keeps emoji ONLY as module identity (sidebar item, module title chip,
//  module tile). Everywhere else the kit used to draw an emoji (StatTile,
//  Pictogram, HowItWorks, DetailList, CountdownBar, WeatherGlyph …) it now
//  draws a simple monochrome Lucide icon in the page hue instead.
//
//  Pages still pass `emoji="💰"` (hundreds of call sites). Rather than
//  touching every page, the kit looks the emoji up here. An emoji with no
//  entry renders NOTHING — never the emoji itself — so the rule holds even
//  for call sites nobody has migrated yet.
//
//  Add an entry when a page uses a new emoji that should keep a picture.

import { createElement } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Accessibility, AlarmClock, Ambulance, Apple, Armchair, ArrowRight, Backpack, Baby, Ban, Banknote,
  Bell, BellOff, Bike, Bot, BookOpen, Briefcase, Building, Building2, Bus, Calculator, Calendar,
  CalendarDays, Camera, Candy, Carrot, ChartColumn, Check, Church, Circle, CircleCheck, CircleHelp,
  CircleX, ClipboardList, Clock, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun,
  Coins, Compass, Construction, Contact, CreditCard, Crown, Droplet, Droplets, Earth, Eye, Factory,
  FileText, Files, Fish, Flag, FlaskConical, Flame, Folder, FolderOpen, Fuel, Gavel, Gem, Gift, Globe,
  GraduationCap, Hammer, Hand, HandCoins, HandHeart, Handshake, HardHat, Hash, Heart, HeartPulse,
  Hospital, Hotel, Hourglass, House, Image, Inbox, Info, Key, Landmark, Laptop, Lightbulb, Library, Link, Lock,
  Luggage, Mail, Mailbox, Map, MapPin, Medal, Megaphone, MessageSquare, Milestone, Milk, Monitor, Moon,
  Mountain, Newspaper, NotebookPen, Package, PenLine, Pencil, Phone, Pickaxe, Pill, Pin, Plane, Plug,
  Puzzle, Receipt, Recycle, Repeat, Rocket, Route, Satellite, Scale, School, ScrollText, Search,
  Settings, Shield, ShieldCheck, ShoppingBasket, Signpost, Siren, Smartphone, Snowflake, Soup, Sparkles,
  Sprout, Star, Stethoscope, Store, Sun, Syringe, Tag, Target, Thermometer, Ticket, Timer, Tractor,
  TrainFront, Trash2, TreeDeciduous, TreePine, TrendingDown, TrendingUp, TriangleAlert, Trophy, Tv,
  Umbrella, User, UserRound, Users, Vote, Wallet, Waves, Wheat, Wind, Wrench, Zap,
} from "lucide-react";

/** Emoji → icon, as written (keys are normalised below). */
const RAW: Record<string, LucideIcon> = {
  // Money
  "💰": Coins, "🪙": Coins, "💵": Banknote, "💸": HandCoins, "🏦": Landmark, "💳": CreditCard,
  "🧾": Receipt, "🧮": Calculator, "👛": Wallet, "📈": TrendingUp, "📉": TrendingDown, "📊": ChartColumn,
  // Buildings and places
  "🏠": House, "🏡": House, "🏘": House, "🏢": Building2, "🏙": Building, "🏛": Landmark, "🛕": Landmark,
  "🕌": Landmark, "⛪": Church, "🏨": Hotel, "🏫": School, "🏥": Hospital, "🏭": Factory, "🏪": Store,
  "🏗": Construction, "🚧": Construction, "🏞": Mountain, "🗺": Map, "📍": MapPin, "📌": Pin,
  "🧭": Compass, "🌍": Earth, "🌏": Earth, "🌐": Globe, "🇮🇳": Flag, "🚩": Flag,
  // People
  "👥": Users, "👨‍👩‍👧": Users, "👪": Users, "🧑‍🤝‍🧑": Users, "🧑": User, "👤": User, "👨": User,
  "👩": UserRound, "👧": UserRound, "👦": UserRound, "👵": UserRound, "👴": UserRound, "🧓": UserRound,
  "🧒": Baby, "👶": Baby, "🤰": Baby, "🧑‍🏫": GraduationCap, "🧑‍🎓": GraduationCap, "🎓": GraduationCap,
  "🧑‍💼": Briefcase, "💼": Briefcase, "🧑‍⚕️": Stethoscope, "🩺": Stethoscope, "👷": HardHat,
  "🧑‍🔧": Wrench, "🧑‍⚖️": Gavel, "👮": ShieldCheck, "🚓": Siren, "🚨": Siren, "👑": Crown,
  "🙋": Hand, "👋": Hand, "🙌": HandHeart, "🤲": HandHeart, "🤝": Handshake, "♿": Accessibility,
  "🧑‍🌾": Tractor,
  // Documents and communication
  "📋": ClipboardList, "📝": NotebookPen, "✍": PenLine, "✏": Pencil, "🗒": FileText, "📄": FileText,
  "📃": FileText, "📑": Files, "📜": ScrollText, "📚": Library, "📖": BookOpen, "📁": Folder,
  "📂": FolderOpen, "🗂": FolderOpen, "🗃": FolderOpen, "📰": Newspaper, "🗞": Newspaper,
  "📢": Megaphone, "📣": Megaphone, "💬": MessageSquare, "📞": Phone, "☎": Phone, "📱": Smartphone,
  "✉": Mail, "📨": Mail, "📧": Mail, "📬": Mailbox, "📥": Inbox, "📇": Contact, "🪪": Contact,
  "🔗": Link, "🔍": Search, "🔎": Search, "🔔": Bell, "🔕": BellOff, "🔒": Lock, "🔑": Key,
  "🏷": Tag, "🆓": Tag, "🎫": Ticket, "🎟": Ticket, "🖼": Image, "📷": Camera, "📺": Tv,
  "💻": Laptop, "🖥": Monitor, "📡": Satellite, "🔢": Hash, "🤖": Bot,
  // Time
  "⏳": Hourglass, "⌛": Hourglass, "⏰": AlarmClock, "⏱": Timer, "🕒": Clock, "🕐": Clock,
  "📅": Calendar, "🗓": CalendarDays, "🔁": Repeat,
  // Status
  "✅": CircleCheck, "✔": Check, "❌": CircleX, "✖": CircleX, "🚫": Ban, "⚠": TriangleAlert,
  "❗": TriangleAlert, "❓": CircleHelp, "ℹ": Info, "🔴": Circle, "🟠": Circle, "🟡": Circle,
  "🟢": Circle, "🎯": Target, "🏆": Trophy, "🏅": Medal, "🌟": Star, "⭐": Star, "✨": Sparkles,
  "💡": Lightbulb, "🎁": Gift, "💎": Gem, "🚀": Rocket, "👀": Eye, "👉": ArrowRight, "🧩": Puzzle,
  "🪜": Milestone, "❤": Heart, "🫀": HeartPulse, "🗳": Vote,
  // Tools and work
  "🛠": Wrench, "🔧": Wrench, "🪛": Wrench, "🔨": Hammer, "⛏": Pickaxe, "⚙": Settings,
  "⚖": Scale, "🛡": Shield, "🔌": Plug, "⚡": Zap, "🔥": Flame, "⛽": Fuel, "🧪": FlaskConical,
  "🪑": Armchair, "🎒": Backpack, "🧳": Luggage, "📦": Package, "🗑": Trash2, "♻": Recycle,
  // Transport
  "🚌": Bus, "🚍": Bus, "🚆": TrainFront, "🚇": TrainFront, "🚉": TrainFront, "✈": Plane,
  "🚏": Signpost, "🛣": Route, "🌉": Route, "🚲": Bike, "🚑": Ambulance, "🚜": Tractor,
  // Health
  "💊": Pill, "💉": Syringe,
  // Water, weather, nature
  "💧": Droplet, "🚰": Droplets, "🌊": Waves, "☔": Umbrella, "🌧": CloudRain, "🌦": CloudRain,
  "⛈": CloudLightning, "🌩": CloudLightning, "❄": Snowflake, "🌫": CloudFog, "☁": Cloud,
  "⛅": CloudSun, "🌤": CloudSun, "🌥": CloudSun, "☀": Sun, "🌙": Moon, "🌡": Thermometer,
  "🌬": Wind, "🌂": CloudDrizzle, "🌱": Sprout, "🌾": Wheat, "🌳": TreeDeciduous, "🌲": TreePine,
  "🧺": ShoppingBasket, "🍎": Apple, "🥕": Carrot, "🥛": Milk, "🐟": Fish, "🍚": Soup, "🍬": Candy,
};

/** Strip the emoji presentation selector so "🏛️" and "🏛" match. */
function norm(emoji: string): string {
  return emoji.replace(/\uFE0F/g, "").trim();
}

const MAP: Record<string, LucideIcon> = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [norm(k), v]));

/**
 * The Lucide icon that stands in for an emoji, or null when the emoji has
 * no calm equivalent (the kit then draws nothing).
 */
export function emojiIcon(emoji: string | null | undefined): LucideIcon | null {
  if (!emoji) return null;
  return MAP[norm(emoji)] ?? null;
}

/**
 * <KitIcon icon={Coins} /> or <KitIcon emoji="💰" /> — draws the Lucide icon
 * (an explicit `icon` wins over the emoji lookup), or nothing. The icon
 * components are module-level constants, so the element type is stable
 * between renders.
 */
export function KitIcon({ icon, emoji, ...props }: { icon?: LucideIcon | null; emoji?: string | null } & LucideProps) {
  const Icon = icon ?? emojiIcon(emoji);
  return Icon ? createElement(Icon, { "aria-hidden": true, ...props }) : null;
}
