import type { Metadata } from "next";
import { SetupRequired } from "@/components/setup-required";
import { isSupabaseConfigured } from "@/lib/env";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  return <SignupForm />;
}
