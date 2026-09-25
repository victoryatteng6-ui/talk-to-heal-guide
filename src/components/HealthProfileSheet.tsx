import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserCog, ShieldCheck, Trash2 } from "lucide-react";
import { HealthProfile, clearProfile, loadProfile, saveProfile } from "@/lib/healthProfile";
import { useToast } from "@/hooks/use-toast";

export function HealthProfileSheet() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<HealthProfile>({});

  useEffect(() => { setP(loadProfile()); }, [open]);

  const update = <K extends keyof HealthProfile>(k: K, v: HealthProfile[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const handleClear = () => {
    clearProfile();
    setP({});
    toast({ title: "Health profile cleared", description: "Saved health-profile information was removed from this device." });
  };

  const handleSave = () => {
    saveProfile(p);
    toast({ title: "Health profile saved", description: "The assistant will now personalize its guidance." });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4" />
          <span className="hidden sm:inline">Health Profile</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Your Health Profile</SheetTitle>
          <SheetDescription>
            Stored only on this device. Used by the assistant to give personalized, safer advice.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hp-age">Age</Label>
              <Input id="hp-age" type="number" min={0} max={120} placeholder="32"
                value={p.age ?? ""} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hp-sex">Sex</Label>
              <select
                id="hp-sex"
                value={p.sex ?? ""}
                onChange={(e) => update("sex", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hp-allergies">Known allergies</Label>
            <Textarea id="hp-allergies" rows={2} placeholder="penicillin, peanuts…"
              value={p.allergies ?? ""} onChange={(e) => update("allergies", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hp-meds">Current medications</Label>
            <Textarea id="hp-meds" rows={2} placeholder="lisinopril 10mg daily…"
              value={p.medications ?? ""} onChange={(e) => update("medications", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hp-cond">Existing conditions</Label>
            <Textarea id="hp-cond" rows={2} placeholder="hypertension, asthma…"
              value={p.conditions ?? ""} onChange={(e) => update("conditions", e.target.value)} />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <span>This info stays on your device (browser local storage). It is sent only with your messages to the assistant for context.</span>
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button variant="destructive" onClick={handleClear} className="mr-auto gap-2">
            <Trash2 className="h-4 w-4" /> Clear profile
          </Button>
          <Button onClick={handleSave}>Save Profile</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
