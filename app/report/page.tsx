import Link from "next/link";
import { ArrowLeftCircleIcon, FilePlusIcon } from "lucide-react";
import { ReportForm } from "@/components/report-form";
import { Button } from "@/components/ui/button";

export default function ReportPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <Button variant="default" className="cursor-pointer">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeftCircleIcon className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="mb-6 mt-6">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            <FilePlusIcon className="mb-1 size-9 inline-block align-middle text-primary" />{" "}
            Report an Item
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            Choose whether you lost something or found something, then describe
            the item as precisely as you can.
          </p>
        </div>
        <ReportForm />
      </main>
    </>
  );
}
