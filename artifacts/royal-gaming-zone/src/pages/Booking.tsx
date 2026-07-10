import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, ArrowLeft, Wallet, Phone, User, Users, Minus, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const games = [
  { name: "Tekken 7", image: "/games/14aa498e66f4f526109c8235a860b6e3.jpg" },
  { name: "It Takes Two", image: "/games/15a7ab3111fa4254ae0e63c4a93205f9.jpg" },
  { name: "Red Dead Redemption 2", image: "/games/18ea1548af776e3305c60114af477d2a.jpg" },
  { name: "WWE 2K25", image: "/games/58a1b96ca5f06339115a451830c9b492.jpg" },
  { name: "Cyberpunk 2077", image: "/games/is-cyberpunk-cover-art-based-on-blade-runners-v0-p99esbve7sf81.jpg" },
  { name: "Uncharted", image: "/games/6807e3e42c5b7653ecdb51d62694915a.jpg" },
  { name: "GTA 5", image: "/games/71uizbdZ5dL.jpg" },
  { name: "Days Gone", image: "/games/76604214217ad3efc6508840031cf691.jpg" },
  { name: "Ghost of Tsushima", image: "/games/8437c6050170789bd804370a30a527ae.jpg" },
  { name: "Hitman 3", image: "/games/86b8ce85bac8dea1cede64f8ae7e3dae_81edae72136714ff6328701b67b0a3b0.jpg" },
  { name: "Resident Evil Village", image: "/games/96569a5d0e8c7b230cf11305d4c6798b.jpg" },
  { name: "Spider-Man: Miles Morales", image: "/games/d1e4b0f2559e0e37ef86862d6018698a.jpg" },
  { name: "God of War", image: "/games/db582a935082e0d61fab9be5a041069c.jpg" },
  { name: "The Last of Us", image: "/games/df3778fa297282cf5825a135510ca420.jpg" },
  { name: "Mortal Kombat", image: "/games/its-like-night-and-day-with-the-quality-of-these-cover-arts-v0-00cfctonr83f1.jpg" },
];

/** Must stay in sync with TIME_SLOTS in the API route. */
const TIME_SLOTS = [
  "10:00 AM – 10:30 AM", "10:30 AM – 11:00 AM",
  "11:00 AM – 11:30 AM", "11:30 AM – 12:00 PM",
  "12:00 PM – 12:30 PM", "12:30 PM – 01:00 PM",
  "01:00 PM – 01:30 PM", "01:30 PM – 02:00 PM",
  "02:00 PM – 02:30 PM", "02:30 PM – 03:00 PM",
  "03:00 PM – 03:30 PM", "03:30 PM – 04:00 PM",
  "04:00 PM – 04:30 PM", "04:30 PM – 05:00 PM",
  "05:00 PM – 05:30 PM", "05:30 PM – 06:00 PM",
  "06:00 PM – 06:30 PM", "06:30 PM – 07:00 PM",
  "07:00 PM – 07:30 PM", "07:30 PM – 08:00 PM",
];

/** Max bookable duration: 10 hours = 20 × 30-min sessions. */
const MAX_SESSIONS = 20;

/** Pricing table matching the home page Pricing section (rupees). */
const PRICING: Record<number, Record<number, number>> = {
  1: { 30: 49,  60: 79  },
  2: { 30: 79,  60: 139 },
  3: { 30: 109, 60: 199 },
  4: { 30: 149, 60: 249 },
};

/** Total cost for N sessions of 30 min each.
 *  Greedily fills 60-min blocks first (cheaper per-min), then a 30-min block.
 *  e.g. 3 sessions (90 min) for 1P = 79 + 49 = ₹128
 */
function calcCost(players: number, sessions: number): number {
  const totalMins = sessions * 30;
  const hours = Math.floor(totalMins / 60);
  const rem   = totalMins % 60;
  return hours * PRICING[players][60] + (rem > 0 ? PRICING[players][30] : 0);
}

/** Human-readable breakdown string, e.g. "1hr ₹79 + 30min ₹49" */
function calcBreakdown(players: number, sessions: number): string {
  const totalMins = sessions * 30;
  const hours = Math.floor(totalMins / 60);
  const rem   = totalMins % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours === 1 ? "1hr" : `${hours}hr`} ₹${hours * PRICING[players][60]}`);
  if (rem  > 0) parts.push(`30min ₹${PRICING[players][30]}`);
  return parts.join(" + ");
}

/**
 * Returns a single time-range label spanning the full session.
 * e.g. startSlot="01:00 PM – 01:30 PM", sessions=4 → "01:00 PM – 03:00 PM"
 */
function getSessionRange(startSlot: string, sessions: number): string {
  const startIdx = TIME_SLOTS.indexOf(startSlot);
  if (startIdx === -1) return startSlot;
  const endIdx = startIdx + sessions - 1;
  if (endIdx >= TIME_SLOTS.length) return startSlot;
  const startTime = startSlot.split(" – ")[0];
  const endTime = TIME_SLOTS[endIdx].split(" – ")[1];
  return sessions === 1 ? startSlot : `${startTime} – ${endTime}`;
}

/** e.g. 3 sessions → "1h 30min" */
function formatDuration(sessions: number): string {
  const totalMins = sessions * 30;
  const hours = Math.floor(totalMins / 60);
  const rem   = totalMins % 60;
  if (hours === 0) return "30 min";
  if (rem === 0)   return `${hours} hr`;
  return `${hours}h 30min`;
}

function getTodayAndTomorrow() {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return [today, tomorrow];
}

function formatDateLabel(d: Date) {
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? `Today, ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : `Tomorrow, ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

/**
 * "YYYY-MM-DD" for the given instant, in IST (Asia/Kolkata).
 * Must match `istDateString` on the backend — using the browser's local
 * timezone (e.g. via toISOString()) here would produce a different date
 * string than what bookings are actually stored/queried under whenever the
 * visitor's device timezone differs from IST, making the "booked slots"
 * lookup silently query the wrong day and show already-booked slots as free.
 */
function formatDateValue(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

type Step = "game" | "datetime" | "confirm" | "success";

export default function Booking() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_token");
  const phone = localStorage.getItem("rgz_phone");

  const [step, setStep] = useState<Step>("game");
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(getTodayAndTomorrow()[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [players, setPlayers]   = useState<number>(1);
  const [sessions, setSessions] = useState<number>(1); // 1 session = 30 min
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash">("wallet");
  const [bookedSlots, setBookedSlots]   = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceFetchFailed, setBalanceFetchFailed] = useState(false);

  useEffect(() => {
    if (!token) setLocation("/customer-portal");
  }, [token, setLocation]);

  /* Fetch wallet balance once on mount */
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.balance === "number") setBalance(data.balance);
        else setBalanceFetchFailed(true);
      })
      .catch(() => setBalanceFetchFailed(true));
  }, [token]);

  /* Fetch taken slots whenever date changes */
  useEffect(() => {
    const dateStr = formatDateValue(selectedDate);
    setSlotsLoading(true);
    setSelectedSlot(null);
    fetch(`${BASE}/api/bookings/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setBookedSlots(data.bookedSlots ?? []))
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const days = getTodayAndTomorrow();
  const durationMin          = sessions * 30;
  const sessionCost          = calcCost(players, sessions);
  const costBreakdown        = calcBreakdown(players, sessions);
  const insufficientBalance  = paymentMethod === "wallet" && balance !== null && balance < sessionCost;

  /** A slot is selectable only if it AND the next (sessions - 1) slots are all free. */
  function isSlotAvailable(slot: string): boolean {
    const idx = TIME_SLOTS.indexOf(slot);
    if (idx === -1) return false;
    for (let i = 0; i < sessions; i++) {
      const si = idx + i;
      if (si >= TIME_SLOTS.length) return false;
      if (bookedSlots.includes(TIME_SLOTS[si])) return false;
    }
    return true;
  }

  /** True if slot falls inside the currently selected range (but is not the start slot itself). */
  function isInSelectedRange(slot: string): boolean {
    if (!selectedSlot || sessions <= 1) return false;
    const startIdx = TIME_SLOTS.indexOf(selectedSlot);
    const slotIdx  = TIME_SLOTS.indexOf(slot);
    return slotIdx > startIdx && slotIdx < startIdx + sessions;
  }

  const handleSubmit = async () => {
    if (!selectedGame || !selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          game: selectedGame.name,
          bookingDate: formatDateValue(selectedDate),
          timeSlot: selectedSlot,
          players,
          durationMin,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      if (typeof data.balance === "number") setBalance(data.balance);
      setStep("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[400px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="glass-panel-heavy py-4 border-b border-primary/20 relative z-20">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link href="/customer-portal">
            <button className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Gamepad2 className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-xl tracking-widest text-white">BOOK A SESSION</span>
        </div>
      </header>

      {/* Step indicator */}
      {step !== "success" && (
        <div className="container mx-auto px-4 pt-6 relative z-10">
          <div className="flex items-center gap-2 max-w-xs">
            {(["game", "datetime", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? "bg-primary text-black"
                  : (["game","datetime","confirm"].indexOf(step) > i) ? "bg-primary/40 text-white"
                  : "bg-white/10 text-gray-500"
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`h-px w-8 transition-colors ${(["game","datetime","confirm"].indexOf(step) > i) ? "bg-primary/40" : "bg-white/10"}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">
              {step === "game" ? "Pick a Game" : step === "datetime" ? "Date & Time" : "Confirm"}
            </span>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
        <AnimatePresence mode="wait">

          {/* STEP 1: PICK GAME */}
          {step === "game" && (
            <motion.div key="game" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-display font-bold text-white mb-5 uppercase tracking-wider">
                Choose a <span className="text-primary">Game</span>
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {games.map((game) => (
                  <motion.div
                    key={game.name}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setSelectedGame(game); setStep("datetime"); }}
                    className="cursor-pointer group relative rounded-lg overflow-hidden border border-white/10 hover:border-primary/60 transition-all"
                    style={{ aspectRatio: "2/3" }}
                  >
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <p className="absolute bottom-0 left-0 right-0 p-1.5 text-[9px] text-white font-bold uppercase leading-tight line-clamp-2 text-center">
                      {game.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: DATE, TIME, PLAYERS & SESSIONS */}
          {step === "datetime" && (
            <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("game")} className="text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                  Pick <span className="text-primary">Date & Time</span>
                </h2>
              </div>

              {/* Selected game reminder */}
              {selectedGame && (
                <div className="flex items-center gap-3 glass-panel border border-primary/20 rounded-xl p-3">
                  <img src={selectedGame.image} alt={selectedGame.name} className="w-10 h-14 object-cover rounded" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Selected Game</p>
                    <p className="text-white font-bold">{selectedGame.name}</p>
                  </div>
                </div>
              )}

              {/* Players */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider">Players</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setPlayers(n); setSelectedSlot(null); }}
                      className={`py-3 rounded-xl border text-center transition-all ${
                        players === n
                          ? "border-primary bg-primary/20 text-primary box-glow"
                          : "border-white/10 bg-card hover:border-primary/40 text-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {n === 1 ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        <span className="text-sm font-bold">{n}P</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* How long to play — max 10 hours */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider">How Long Do You Want to Play?</span>
                </div>

                {/* Stepper row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setSessions(s => Math.max(1, s - 1)); setSelectedSlot(null); }}
                    disabled={sessions <= 1}
                    className="w-10 h-10 rounded-xl border border-white/10 bg-card flex items-center justify-center text-gray-300 hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 glass-panel border border-primary/30 rounded-xl px-4 py-3 text-center">
                    <p className="text-primary font-display font-bold text-lg leading-tight">
                      {formatDuration(sessions)}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">Max 10 hours per booking</p>
                  </div>

                  <button
                    onClick={() => { setSessions(s => Math.min(MAX_SESSIONS, s + 1)); setSelectedSlot(null); }}
                    disabled={sessions >= MAX_SESSIONS}
                    className="w-10 h-10 rounded-xl border border-white/10 bg-card flex items-center justify-center text-gray-300 hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Cost breakdown */}
                <div className="mt-3 glass-panel border border-primary/10 rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-gray-400 text-sm">{costBreakdown}</p>
                  <p className="text-primary font-display font-bold text-lg">₹{sessionCost}</p>
                </div>

                {/* Quick presets */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 4, 6, 8, 10].map((hrs) => {
                    const s = hrs * 2; // sessions = 30-min blocks
                    return (
                      <button
                        key={s}
                        onClick={() => { setSessions(s); setSelectedSlot(null); }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          sessions === s
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/10 bg-card text-gray-500 hover:border-primary/40 hover:text-gray-300"
                        }`}
                      >
                        {formatDuration(s)} · ₹{calcCost(players, s)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date picker */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider">Select Date</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {days.map((day) => {
                    const isSelected = formatDateValue(day) === formatDateValue(selectedDate);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`py-4 rounded-xl border text-center transition-all ${
                          isSelected ? "border-primary bg-primary/20 text-primary box-glow" : "border-white/10 bg-card hover:border-primary/40 text-gray-300"
                        }`}
                      >
                        <div className="text-base font-display font-bold">{formatDateLabel(day)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{day.toLocaleDateString("en-IN", { weekday: "long" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider">When Would You Like to Play?</span>
                  {slotsLoading && <span className="text-xs text-gray-500 animate-pulse ml-1">loading...</span>}
                </div>

                {/* Range indicator */}
                {selectedSlot ? (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="text-xs text-primary font-bold">
                      {getSessionRange(selectedSlot, sessions)}
                      {sessions > 1 && <span className="text-primary/60 font-normal"> · {formatDuration(sessions)}</span>}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">
                    {sessions > 1
                      ? `Pick a start time — all ${sessions} consecutive slots will be highlighted.`
                      : "Select your start time below."}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const available = isSlotAvailable(slot);
                    const isSelected = selectedSlot === slot;
                    const inRange = isInSelectedRange(slot);
                    const isEndSlot = sessions > 1 && selectedSlot !== null &&
                      TIME_SLOTS.indexOf(slot) === TIME_SLOTS.indexOf(selectedSlot) + sessions - 1;

                    return (
                      <button
                        key={slot}
                        disabled={!available && !inRange}
                        onClick={() => available && setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-lg border text-sm transition-all text-left relative ${
                          !available && !inRange
                            ? "border-white/5 bg-card/30 text-gray-700 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/20 text-primary box-glow"
                            : inRange
                            ? "border-primary/40 bg-primary/10 text-primary/70 cursor-default"
                            : "border-white/10 bg-card hover:border-primary/40 text-gray-300"
                        }`}
                      >
                        <span className={inRange && !isSelected ? "opacity-80" : ""}>
                          {slot.split(" – ")[0]}
                        </span>
                        {!available && !inRange && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider text-red-500/70 font-bold">Booked</span>
                        )}
                        {isSelected && sessions > 1 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider text-primary font-bold">Start</span>
                        )}
                        {isEndSlot && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider text-primary/70 font-bold">End</span>
                        )}
                        {inRange && !isSelected && !isEndSlot && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-primary/40">▶</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider">Payment Method</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all ${
                      paymentMethod === "wallet" ? "border-primary bg-primary/10 box-glow" : "border-white/10 bg-card hover:border-primary/40"
                    }`}
                  >
                    <Wallet className={`w-5 h-5 shrink-0 ${paymentMethod === "wallet" ? "text-primary" : "text-gray-500"}`} />
                    <div>
                      <p className="text-white font-bold text-sm">Wallet</p>
                      <p className="text-gray-500 text-xs">Deducted on confirm</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all ${
                      paymentMethod === "cash" ? "border-primary bg-primary/10 box-glow" : "border-white/10 bg-card hover:border-primary/40"
                    }`}
                  >
                    <Phone className={`w-5 h-5 shrink-0 ${paymentMethod === "cash" ? "text-primary" : "text-gray-500"}`} />
                    <div>
                      <p className="text-white font-bold text-sm">Cash</p>
                      <p className="text-gray-500 text-xs">Pay at the counter</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                disabled={!selectedSlot}
                onClick={() => setStep("confirm")}
                className="w-full h-12 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("datetime")} className="text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                  Confirm <span className="text-primary">Booking</span>
                </h2>
              </div>

              <div className="glass-panel border border-primary/30 rounded-2xl overflow-hidden">
                <div className="relative h-40">
                  <img src={selectedGame?.image} alt={selectedGame?.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <p className="text-primary text-xs uppercase tracking-widest font-bold mb-1">Selected Game</p>
                    <p className="text-white text-2xl font-display font-bold">{selectedGame?.name}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                      <p className="font-bold text-white">{formatDateLabel(selectedDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Time · Duration</p>
                      <p className="font-bold text-white">{selectedSlot ? getSessionRange(selectedSlot, sessions) : "—"} · {formatDuration(sessions)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Players · Account</p>
                      <p className="font-bold text-white">{players} {players === 1 ? "player" : "players"} · +91 {phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Wallet className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{paymentMethod === "wallet" ? "Wallet Charge" : "Amount Due (Cash)"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">₹{sessionCost}</p>
                        {sessions > 1 && costBreakdown && (
                          <span className="text-xs text-gray-500">({costBreakdown})</span>
                        )}
                        {paymentMethod === "wallet" && balance !== null && (
                          <span className={`text-xs font-semibold ${balance >= sessionCost ? "text-green-400" : "text-red-400"}`}>
                            balance: ₹{balance}
                          </span>
                        )}
                        {paymentMethod === "wallet" && balanceFetchFailed && (
                          <span className="text-xs text-yellow-400">(balance unavailable)</span>
                        )}
                        {paymentMethod === "cash" && (
                          <span className="text-xs text-yellow-400">Pay at counter</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {insufficientBalance && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-bold text-sm">Insufficient wallet balance</p>
                  <p className="text-red-400/70 text-xs mt-1">
                    You need ₹{sessionCost} but only have ₹{balance}. Please ask staff to top up your wallet.
                  </p>
                </div>
              )}

              {balanceFetchFailed && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                  <p className="text-yellow-400 font-bold text-sm">Could not load wallet balance</p>
                  <p className="text-yellow-400/70 text-xs mt-1">
                    The booking will be rejected if funds are insufficient.
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">Staff will confirm your booking shortly.</p>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <Button
                onClick={handleSubmit}
                disabled={loading || insufficientBalance}
                className="w-full h-12 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90 box-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Confirm Booking"}
              </Button>
            </motion.div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <CheckCircle className="w-20 h-20 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-wider text-glow">Booking Sent!</h2>
                <p className="text-gray-400 max-w-xs">
                  Your booking for <span className="text-primary font-bold">{selectedGame?.name}</span> on{" "}
                  <span className="text-white">{formatDateLabel(selectedDate)}</span> at{" "}
                  <span className="text-white">{selectedSlot}</span> ({formatDuration(sessions)},{" "}
                  {players} {players === 1 ? "player" : "players"}) has been submitted.
                </p>
                <p className="text-gray-500 text-sm mt-2">The staff will confirm your slot shortly.</p>
                {balance !== null && (
                  <p className="text-gray-500 text-sm mt-1">Remaining balance: <span className="text-primary font-bold">₹{balance}</span></p>
                )}
              </div>
              <div className="flex gap-3">
                <Link href="/customer-portal">
                  <Button variant="outline" className="border-primary text-primary">My Profile</Button>
                </Link>
                <Link href="/">
                  <Button className="bg-primary text-black hover:bg-primary/90">Back to Home</Button>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
