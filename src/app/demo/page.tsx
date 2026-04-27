import type { Metadata } from "next";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Jarvis · Investor demo",
  description:
    "Six-slide narrative; Enter live system opens HUD home (/) — then proposals, approval, and proof in the app.",
};

export default function DemoPage() {
  return <DemoExperience />;
}
