"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findAndSaveMatches } from "@/lib/matcher";
import { reportSchema } from "@/lib/validation";

export interface ReportFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  itemId?: string;
}

export async function createReport(
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    const fieldErrors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
      if (messages.length > 0) fieldErrors[field] = messages[0];
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const item = await prisma.item.create({ data: parsed.data });

    try {
      await findAndSaveMatches(item);
    } catch (error) {
      console.error("Matching failed for report:", error);
    }

    revalidatePath("/");
    return { status: "success", itemId: item.id };
  } catch (error) {
    console.error("Failed to create report:", error);
    return {
      status: "error",
      message:
        "Something went wrong while submitting the report. Please try again.",
    };
  }
}
