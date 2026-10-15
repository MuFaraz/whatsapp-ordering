import type { Metadata } from "next";
import { SetupRequired } from "@/components/setup-required";
import { isSupabaseConfigured } from "@/lib/env";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  return <ForgotPasswordForm />;
}
