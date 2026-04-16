import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Phone, MessageCircle, MapPin, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LABS, ALL_TESTS, Lab } from "@/lib/labsData";
import { Disclaimer } from "@/components/Disclaimer";
import { bump } from "@/lib/stats";
import { useToast } from "@/hooks/use-toast";

// Fix default icon (Leaflet expects assets we don't bundle)
const icon = L.divIcon({
  className: "",
  html: `<div style="background:hsl(162 48% 45%);width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px;">+</div>
  </div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
});

const NIGERIA_CENTER: [number, number] = [9.0820, 8.6753];

export default function Labs() {
  const { toast } = useToast();
  const [test, setTest] = useState<string>("All");
  const [city, setCity] = useState<string>("All");

  const cities = useMemo(() => ["All", ...Array.from(new Set(LABS.map((l) => l.city)))], []);
  const filtered = useMemo(
    () =>
      LABS.filter(
        (l) =>
          (test === "All" || l.tests.includes(test as Lab["tests"][number])) &&
          (city === "All" || l.city === city)
      ),
    [test, city]
  );

  const center = filtered.length === 1
    ? ([filtered[0].lat, filtered[0].lng] as [number, number])
    : city !== "All" && filtered[0]
    ? ([filtered[0].lat, filtered[0].lng] as [number, number])
    : NIGERIA_CENTER;

  const handleBook = (lab: Lab) => {
    bump("labBookings", 1);
    toast({ title: "Booking request noted", description: `Demo: ${lab.name}` });
  };

  return (
    <div className="container max-w-6xl px-4 py-6 space-y-6">
      <Disclaimer />

      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-primary" /> Find Nearby Labs
        </h1>
        <p className="text-sm text-muted-foreground">
          Curated diagnostic centers across Nigeria. Book Malaria, Typhoid and other common tests.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Test</label>
          <select value={test} onChange={(e) => setTest(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="All">All tests</option>
            {ALL_TESTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm h-[480px]">
          <MapContainer center={center} zoom={city === "All" ? 6 : 11} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((l) => (
              <Marker key={l.id} position={[l.lat, l.lng]} icon={icon}>
                <Popup>
                  <strong>{l.name}</strong><br />
                  <span style={{ fontSize: 12 }}>{l.address}</span><br />
                  <span style={{ fontSize: 12 }}>From ₦{l.priceFromNGN.toLocaleString()}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((lab) => (
            <article key={lab.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="font-display font-semibold text-foreground">{lab.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {lab.address}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {lab.tests.map((t) => (
                  <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">From ₦{lab.priceFromNGN.toLocaleString()}</span>
                <div className="flex gap-1">
                  <Button asChild size="sm" variant="ghost" onClick={() => handleBook(lab)}>
                    <a href={`tel:${lab.phone}`} aria-label="Call lab"><Phone className="h-4 w-4" /></a>
                  </Button>
                  {lab.whatsapp && (
                    <Button asChild size="sm" variant="ghost" onClick={() => handleBook(lab)}>
                      <a
                        href={`https://wa.me/${lab.whatsapp}?text=${encodeURIComponent(`Hi, I want to book a ${test === "All" ? "" : test + " "}test at ${lab.name}.`)}`}
                        target="_blank" rel="noreferrer" aria-label="WhatsApp lab"
                      ><MessageCircle className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleBook(lab)}>Book Now</Button>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No labs match these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
