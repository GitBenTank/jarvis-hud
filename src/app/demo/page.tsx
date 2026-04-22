import type { Metadata } from "next";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Jarvis · Investor demo",
  description:
    "Cinematic walkthrough — control plane for AI execution (propose, approve, execute, receipt, trace).",
};

export default function DemoPage() {
  return <DemoExperience />;
}
