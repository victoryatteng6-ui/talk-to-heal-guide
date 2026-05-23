import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, Search, Stethoscope, CalendarCheck, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Disclaimer } from "@/components/Disclaimer";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  name: string;
  specialty: string;
}
interface Clinic {
  id: string;
  name: string;
  location: string;
  doctors: Doctor[];
}

const DEFAULT_CLINICS: Clinic[] = [
  {
    id: "prime-medical",
    name: "Prime Medical Centre",
    location: "Airport Road, Igwuruta",
    doctors: [
      { name: "Dr. Amara Okeke", specialty: "General Medicine" },
      { name: "Dr. Tunde Bello", specialty: "Emergency Care" },
    ],
  },
  {
    id: "shield-hospital",
    name: "Shield Hospital",
    location: "Trans-Amadi, Port Harcourt",
    doctors: [
      { name: "Dr. Ngozi Eze", specialty: "Pediatrics" },
      { name: "Dr. Samuel Adeyemi", specialty: "Internal Medicine" },
    ],
  },
  {
    id: "apex-diagnostic",
    name: "Apex Diagnostic Clinic",
    location: "GRA Phase 2, Port Harcourt",
    doctors: [
      { name: "Dr. Funmi Adebayo", specialty: "Family Health" },
      { name: "Dr. Kelechi Nwosu", specialty: "Cardiology" },
    ],
  },
];

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

interface Booking {
  id: string;
  clinicId: string;
  clinicName: string;
  clinicLocation: string;
  patientName: string;
  date: string;
  timeSlot: string;
  reason: string;
  createdAt: number;
}

const STORAGE_KEY = "clinic_bookings_v1";

function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export default function Clinics() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingClinic, setBookingClinic] = useState<Clinic | null>(null);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  const [patientName, setPatientName] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_CLINICS;
    return DEFAULT_CLINICS.filter((c) =>
      [c.name, c.location, ...c.doctors.map((d) => `${d.name} ${d.specialty}`)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const openBooking = (clinic: Clinic) => {
    setBookingClinic(clinic);
    setPatientName("");
    setDate("");
    setTimeSlot(TIME_SLOTS[0]);
    setReason("");
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingClinic) return;
    if (!patientName.trim() || !date || !timeSlot || !reason.trim()) {
      toast({ title: "Please complete all fields", variant: "destructive" });
      return;
    }
    const booking: Booking = {
      id: crypto.randomUUID(),
      clinicId: bookingClinic.id,
      clinicName: bookingClinic.name,
      clinicLocation: bookingClinic.location,
      patientName: patientName.trim(),
      date,
      timeSlot,
      reason: reason.trim(),
      createdAt: Date.now(),
    };
    const next = [booking, ...bookings];
    saveBookings(next);
    setBookings(next);
    setBookingClinic(null);
    setConfirmed(booking);
  };

  const cancelBooking = (id: string) => {
    const next = bookings.filter((b) => b.id !== id);
    saveBookings(next);
    setBookings(next);
    toast({ title: "Booking removed" });
  };

  const today = new Date().toISOString().split("T")[0];

  const upcoming = bookings
    .filter((b) => b.date >= today)
    .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));

  return (
    <div className="container max-w-6xl px-4 py-6 space-y-8">
      <Disclaimer />

      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" /> Clinic Finder & Booking
        </h1>
        <p className="text-sm text-muted-foreground">
          Find nearby clinics, view available doctors, and book an appointment in seconds.
        </p>
      </header>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by clinic, location, doctor or specialty"
          className="pl-9"
          aria-label="Search clinics"
        />
      </div>

      {/* Clinic grid */}
      <section aria-labelledby="clinics-heading" className="space-y-4">
        <h2 id="clinics-heading" className="sr-only">Clinics</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((clinic, i) => (
            <motion.article
              key={clinic.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
                    {clinic.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {clinic.location}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex-1 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available Doctors
                </p>
                <ul className="space-y-1.5">
                  {clinic.doctors.map((d) => (
                    <li key={d.name} className="flex items-start gap-2 text-sm">
                      <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-foreground">
                        {d.name}
                        <span className="block text-xs text-muted-foreground">{d.specialty}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="mt-5 w-full" onClick={() => openBooking(clinic)}>
                <CalendarCheck className="mr-2 h-4 w-4" /> Book Appointment
              </Button>
            </motion.article>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-12">
              No clinics match your search.
            </p>
          )}
        </div>
      </section>

      {/* Upcoming bookings */}
      <section aria-labelledby="upcoming-heading" className="space-y-4">
        <h2 id="upcoming-heading" className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Upcoming Bookings
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No upcoming appointments. Book one above to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{b.clinicName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {b.clinicLocation}
                  </p>
                  <p className="text-sm text-foreground mt-2">
                    {new Date(b.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {b.timeSlot}
                  </p>
                  <p className="text-xs text-muted-foreground">Patient: {b.patientName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">Reason: {b.reason}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => cancelBooking(b.id)}
                  aria-label="Remove booking"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking modal */}
      <Dialog open={!!bookingClinic} onOpenChange={(o) => !o && setBookingClinic(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              {bookingClinic?.name} — {bookingClinic?.location}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitBooking} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-name">Patient Name</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-slot">Time Slot</Label>
              <select
                id="time-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason"
                rows={3}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setBookingClinic(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Confirm Booking</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success modal */}
      <Dialog open={!!confirmed} onOpenChange={(o) => !o && setConfirmed(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Booking Confirmed!
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Please arrive 10 minutes early.
                </p>
                <div className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left text-sm space-y-1">
                  <p><span className="text-muted-foreground">Clinic:</span> <span className="font-medium">{confirmed.clinicName}</span></p>
                  <p><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{confirmed.patientName}</span></p>
                  <p>
                    <span className="text-muted-foreground">When:</span>{" "}
                    <span className="font-medium">
                      {new Date(confirmed.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at {confirmed.timeSlot}
                    </span>
                  </p>
                </div>
                <Button className="w-full" onClick={() => setConfirmed(null)}>Done</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
