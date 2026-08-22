import { z } from "zod";

export const CATEGORIES = [
  "Electronics",
  "Documents",
  "ID Cards",
  "Keys",
  "Clothing",
  "Bags",
  "Other",
] as const;

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().max(maxLength).optional(),
  );

export const reportSchema = z.object({
  reportType: z.enum(["LOST", "FOUND"]),
  name: z.string().trim().min(1, "Item name is required."),
  category: optionalText(50),
  color: optionalText(30),
  description: z.string().trim().min(1, "Description is required."),
  location: z.string().trim().min(1, "Location is required."),
  dateAndTime: z.coerce.date({ error: "A valid date and time is required." }),
});

export type ReportInput = z.infer<typeof reportSchema>;
