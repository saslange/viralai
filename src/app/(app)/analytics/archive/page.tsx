import { IdeasArchive } from "@/components/ideas-archive";

export default function ArchivePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Ideen-Archiv</h1>
        <p className="text-sm text-neutral-500">
          Alle deine generierten Content-Ideen, sortiert nach Datum und Thema.
        </p>
      </div>

      <IdeasArchive />
    </div>
  );
}
