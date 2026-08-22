"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReport, type ReportFormState } from "@/lib/actions/report-actions";
import { CATEGORIES } from "@/lib/validation";

const initialState: ReportFormState = { status: "idle" };
const OTHER_OPTION = "__other__";

export function ReportForm() {
  const [state, formAction, pending] = useActionState(createReport, initialState);
  const [reportType, setReportType] = useState<string | null>(null);
  const [categoryChoice, setCategoryChoice] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const submittedCategory =
    categoryChoice === OTHER_OPTION ? customCategory : (categoryChoice ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>New report</CardTitle>
        <CardDescription>
          Tell us what you lost or found. We will look for potential matches
          right away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="reportType" value={reportType ?? ""} />
          <input type="hidden" name="category" value={submittedCategory} />

          <div className="grid gap-2">
            <Label htmlFor="report-type">Report type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue placeholder="Lost or found?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOST">LOST — I lost something</SelectItem>
                <SelectItem value="FOUND">FOUND — I found something</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.reportType && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.reportType}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Item name *</Label>
            <Input id="name" name="name" placeholder="e.g. Black AirPods case" />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category-select">Category</Label>
            <Select value={categoryChoice} onValueChange={setCategoryChoice}>
              <SelectTrigger id="category-select" className="w-full">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_OPTION}>Other…</SelectItem>
              </SelectContent>
            </Select>
            {categoryChoice === OTHER_OPTION && (
              <Input
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder="Enter your own category"
                aria-label="Custom category"
              />
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" placeholder="e.g. Black" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateAndTime">Date and time *</Label>
              <Input id="dateAndTime" name="dateAndTime" type="datetime-local" />
              {state.fieldErrors?.dateAndTime && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.dateAndTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Library entrance"
            />
            {state.fieldErrors?.location && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.location}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe the item, any marks or stickers, and where you last saw it."
            />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description}
              </p>
            )}
          </div>

          {state.status === "error" && state.message && (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {state.status === "success" && state.itemId && (
            <Alert>
              <AlertTitle>Report submitted</AlertTitle>
              <AlertDescription>
                We checked your report against existing ones.{" "}
                <Link href={`/matches/${state.itemId}`}>View matches</Link>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
