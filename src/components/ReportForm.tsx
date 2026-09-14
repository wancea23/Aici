"use client";

import { useRef, useState } from "react";
import { Camera, Send } from "lucide";
import Icon from "@/components/Icon";
import { inputClass, linkClass, primaryButton, secondaryButton } from "@/components/auth/ui";
import { categories, categoryLabels, statusLabels, type Category, type Status } from "@/lib/validation";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { howMany } from "@/lib/format";

type Coords = { lat: number; lng: number };

type NearbyReport = {
  id: string;
  description: string;
  status: string;
  created_at: string;
  // reports in its group, itself included
  count: number;
};

const PERMISSION_DENIED = 1;

// One position request, rejected with the browser's error.
function position(highAccuracy: boolean) {
  return new Promise<Coords>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: highAccuracy ? 0 : 300000 }
    )
  );
}

export default function ReportForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const asking = useRef(0);
  const [category, setCategory] = useState<Category>("groapa");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<NearbyReport[] | null>(null);
  const [followedId, setFollowedId] = useState<string | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) void locate();
  }

  // Resolves with the position, or null after saying why there is none. Some phones, iPhones
  // above all, only show the location prompt right after a tap, so the send button asks again.
  async function locate(): Promise<Coords | null> {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Locația nu e disponibilă pe acest dispozitiv.");
      return null;
    }
    asking.current++;
    setLocating(true);
    try {
      // GPS first. Indoors it can time out, and then the rough position of the phone will do.
      const found = await Promise.race([
        position(true).catch((err: GeolocationPositionError) => {
          if (err.code === PERMISSION_DENIED) throw err;
          return position(false);
        }),
        // a prompt that never shows up would otherwise leave the form waiting forever
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("no answer")), 25000)),
      ]);
      setCoords(found);
      return found;
    } catch (err) {
      const denied = (err as GeolocationPositionError).code === PERMISSION_DENIED;
      setGeoError(
        denied
          ? "Browserul nu are voie să citească locația. Permite-o din setările telefonului, apoi apasă din nou."
          : "Nu am putut citi locația. Dacă ai deschis linkul din Telegram sau Instagram, deschide-l în Safari sau Chrome."
      );
      return null;
    } finally {
      if (--asking.current === 0) setLocating(false);
    }
  }

  async function createReport(at: Coords) {
    setBusy(true);
    try {
      const body = new FormData();
      body.set("photo", await shrinkPhoto(photo!), "photo.jpg");
      body.set("category", category);
      body.set("description", description);
      body.set("lat", String(at.lat));
      body.set("lng", String(at.lng));

      const res = await fetch("/api/reports", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "A apărut o eroare.");
      setDuplicates(null);
      setDoneId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!photo) return setError("Adaugă o poză.");

    // Still no position: this tap asks again, and the report goes as soon as it comes.
    setBusy(true);
    const at = coords ?? (await locate());
    if (!at) {
      setBusy(false);
      return setError("Fără locație nu putem trimite sesizarea.");
    }

    try {
      const params = new URLSearchParams({
        category,
        lat: String(at.lat),
        lng: String(at.lng),
      });
      const res = await fetch(`/api/reports/nearby?${params}`);
      const nearby = res.ok ? ((await res.json()) as NearbyReport[]) : [];
      if (nearby.length > 0) {
        setDuplicates(nearby);
        setBusy(false);
        return;
      }
    } catch {
      // If the check itself fails, don't block the user from reporting — fall through and create it.
    }
    await createReport(at);
  }

  function followExisting(id: string) {
    setDuplicates(null);
    setFollowedId(id);
  }

  function reset() {
    setPhoto(null);
    setPreview(null);
    setCoords(null);
    setGeoError(null);
    setCategory("groapa");
    setDescription("");
    setError(null);
    setDoneId(null);
    setDuplicates(null);
    setFollowedId(null);
  }

  if (followedId) {
    return (
      <div className="rounded-xl bg-brand-50 p-5 text-center">
        <p className="font-medium text-brand-800">Bine, nu mai trimitem una nouă.</p>
        <p className="mt-1 text-sm text-slate-600">
          Sesizarea existentă (cod {followedId.slice(0, 8)}) acoperă deja problema ta.
        </p>
        <button onClick={reset} className={`mt-4 text-sm ${linkClass}`}>
          Raportează altceva
        </button>
      </div>
    );
  }

  if (doneId) {
    return (
      <div className="rounded-xl bg-brand-50 p-5 text-center">
        <p className="font-medium text-brand-800">Sesizarea a fost trimisă.</p>
        <p className="mt-1 text-sm text-slate-600">Cod: {doneId.slice(0, 8)}</p>
        <button onClick={reset} className={`mt-4 text-sm ${linkClass}`}>
          Raportează alta
        </button>
      </div>
    );
  }

  if (duplicates && duplicates.length > 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="font-medium text-amber-800">
            Am găsit {duplicates.length === 1 ? "o sesizare" : `${duplicates.length} sesizări`}{" "}
            asemănătoare în apropiere.
          </p>
          <p className="mt-1 text-sm text-amber-700">Poate cineva a raportat deja aceeași problemă.</p>
        </div>

        <ul className="space-y-2">
          {duplicates.map((d) => (
            <li key={d.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={`/api/media/${d.id}`}
                alt=""
                className="h-64 w-full bg-slate-100 object-cover"
              />
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {statusLabels[d.status as Status] ?? d.status}
                    {d.count > 1 && (
                      <span className="font-normal text-slate-500">, raportată de {howMany(d.count, "ori")}</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(d.created_at).toLocaleDateString("ro-RO")}
                  </span>
                </div>
                {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
              </div>
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => followExisting(duplicates[0].id)}
            className={`flex-1 text-sm ${primaryButton}`}
          >
            E aceeași problemă
          </button>
          <button
            type="button"
            onClick={() => coords && createReport(coords)}
            disabled={busy}
            className={`flex-1 text-sm ${secondaryButton}`}
          >
            {busy ? "Se trimite..." : "Nu, e diferită"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40">
          {preview ? (
            <img src={preview} alt="" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-slate-500">
              <Icon node={Camera} className="h-6 w-6 text-slate-400" />
              Fă o poză sau alege una
            </span>
          )}
          {/* no capture attribute, so phones offer both the camera and the gallery */}
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
        <p className={`mt-2 text-xs ${geoError && !coords ? "text-red-600" : "text-slate-400"}`}>
          {coords
            ? `Locație: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : locating
              ? "Se caută locația..."
              : geoError ?? "Locația se adaugă după poză."}
        </p>
        {photo && !coords && !locating && (
          <button
            type="button"
            onClick={() => void locate()}
            className={`mt-1 text-xs ${linkClass}`}
          >
            {geoError ? "Încearcă din nou" : "Adaugă locația acum"}
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Categorie</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (category === c
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50")
              }
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descriere</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Ce ai observat?"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className={`flex items-center justify-center gap-2 ${primaryButton}`}
      >
        {!busy && <Icon node={Send} className="h-4 w-4" />}
        {busy ? (locating ? "Se caută locația..." : "Se trimite...") : "Trimite sesizarea"}
      </button>
    </form>
  );
}
