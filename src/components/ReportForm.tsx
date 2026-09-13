"use client";

import { useState } from "react";
import { categories, categoryLabels, type Category } from "@/lib/validation";
import { shrinkPhoto } from "@/lib/shrink-photo";

type Coords = { lat: number; lng: number };

export default function ReportForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("groapa");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) locate();
  }

  function locate() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Locația nu e disponibilă pe acest dispozitiv.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError("Nu am putut citi locația. Verifică permisiunea."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!photo) return setError("Adaugă o poză.");
    if (!coords) return setError("Aștept locația. Apasă din nou dacă întârzie.");

    setBusy(true);
    try {
      const body = new FormData();
      body.set("photo", await shrinkPhoto(photo), "photo.jpg");
      body.set("category", category);
      body.set("description", description);
      body.set("lat", String(coords.lat));
      body.set("lng", String(coords.lng));

      const res = await fetch("/api/reports", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "A apărut o eroare.");
      setDoneId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setBusy(false);
    }
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
  }

  if (doneId) {
    return (
      <div className="rounded-xl bg-brand-50 p-5 text-center">
        <p className="font-medium text-brand-800">Sesizarea a fost trimisă.</p>
        <p className="mt-1 text-sm text-slate-600">Cod: {doneId.slice(0, 8)}</p>
        <button onClick={reset} className="mt-4 text-sm font-medium text-brand-700 hover:underline">
          Raportează alta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-brand-500">
          {preview ? (
            <img src={preview} alt="" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <span className="text-sm text-slate-500">Fă o poză sau alege una</span>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPhoto}
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          {coords
            ? `Locație: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : geoError ?? "Locația se adaugă după poză."}
        </p>
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
                "rounded-full border px-3 py-1.5 text-sm " +
                (category === c
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400")
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
          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Se trimite..." : "Trimite sesizarea"}
      </button>
    </form>
  );
}
