import PageHeader from "@/components/PageHeader";
import IrsTable from "@/components/IrsTable";
import { IRS_ROWS } from "@/lib/mock";

export default function IrsPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title="Estado"
        accent="fiscal"
        subtitle="Formularios y consentimientos del IRS por cliente."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-up/25 bg-up/10 px-3.5 py-1.5 text-xs font-medium text-up">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
            </span>
            Conectado vía IRS
          </span>
        }
      />

      <div className="mt-8">
        <IrsTable rows={IRS_ROWS} />
      </div>
    </div>
  );
}
