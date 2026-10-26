"use client";

import { ListingEditor } from "@/components/listing/ListingEditor";
import { useMyListing } from "@/lib/my-listing";

export default function EditListingPage() {
  const { loaded } = useMyListing();
  // Wait for the saved listing so the form starts from it, not from blank.
  return loaded ? <ListingEditor /> : null;
}
