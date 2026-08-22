import Link from "next/link";
import { ReportForm } from "@/components/report-form";

export default function ReportPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Report an Item
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
          Choose whether you lost something or found something, then describe
          the item as precisely as you can.
        </p>
      </div>
      <ReportForm />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Back to dashboard
        </Link>
      </p>
    </main>
  );
}
