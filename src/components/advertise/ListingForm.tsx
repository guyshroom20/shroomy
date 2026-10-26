"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/auth/AuthForm";
import type { Tables } from "@/lib/supabase/database.types";
import { saveListing, type ListingFormState } from "@/app/advertise/actions";

export function ListingForm({ listing }: { listing: Tables<"listings"> | null }) {
  const [state, action, pending] = useActionState<ListingFormState, FormData>(saveListing, {});
  const tags = ((listing?.tags as { label: string }[] | null) ?? []).map((t) => t.label).join(", ");
  return (
    <form action={action} className="space-y-4">
      <Field label="Display name" name="display_name" defaultValue={listing?.display_name} maxLength={40} required />
      <Field label="Profile link (shroom.uk/profile/…)" name="slug" defaultValue={listing?.slug} pattern="[a-z0-9][a-z0-9-]{2,39}" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age" name="age" type="number" min={18} max={99} defaultValue={listing?.age} required />
        <label className="block">
          <span className="text-[13px] text-fg-muted">Availability</span>
          <select
            name="availability"
            defaultValue={listing?.availability ?? "offline"}
            className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3.5 text-[16px] text-fg ring-1 ring-line"
          >
            <option value="available">Available now</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
        </label>
      </div>
      <Field label="Area shown on your profile" name="area" placeholder="Shoreditch, London" defaultValue={listing?.area} required />
      <Field
        label="Postcode district, for the map (never shown)"
        name="district"
        placeholder="E2"
        maxLength={4}
      />
      <label className="block">
        <span className="text-[13px] text-fg-muted">About you</span>
        <textarea
          name="bio"
          rows={5}
          maxLength={2000}
          defaultValue={listing?.bio}
          className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3.5 text-[16px] text-fg outline-none ring-1 ring-line focus:ring-fg-muted"
        />
      </label>
      <Field label="Tags, separated by commas" name="tags" defaultValue={tags} placeholder="Movie buff, Wellness" />
      <FormError message={state.error} />
      {state.saved && <p className="text-[14px] text-online">Saved.</p>}
      <SubmitButton pending={pending}>{listing ? "Save changes" : "Create profile"}</SubmitButton>
    </form>
  );
}
