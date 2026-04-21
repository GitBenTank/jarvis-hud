import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { ensureDir, ensurePathSafe, getSendEmailReceiptPath } from "./storage";
import type { SendEmailPayload } from "./send-email-constants";

export type ExecuteSendEmailResult = {
  messageId: string;
  receiptPath: string;
};

/**
 * Sends one outbound email (demo) and writes a JSON receipt under JARVIS_ROOT.
 * Requires DEMO_EMAIL_USER + DEMO_EMAIL_PASS (Gmail app password recommended).
 */
export async function executeSendEmailAndWriteReceipt(args: {
  payload: SendEmailPayload;
  approvalId: string;
  dateKey: string;
  executedAt: string;
  traceId: string;
}): Promise<ExecuteSendEmailResult> {
  const user = process.env.DEMO_EMAIL_USER?.trim();
  const pass = process.env.DEMO_EMAIL_PASS?.trim();
  if (!user || !pass) {
    throw new Error(
      "DEMO_EMAIL_USER and DEMO_EMAIL_PASS must be set in the server environment to execute send_email."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const from = process.env.DEMO_EMAIL_FROM?.trim() || user;
  const info = await transporter.sendMail({
    from,
    to: args.payload.to,
    subject: args.payload.subject,
    text: args.payload.body,
  });

  const messageId = typeof info.messageId === "string" ? info.messageId : "";
  const receiptPath = getSendEmailReceiptPath(args.dateKey, args.approvalId);
  ensurePathSafe(receiptPath);
  await ensureDir(path.dirname(receiptPath));

  const receipt = {
    status: "EXECUTED",
    kind: "send_email",
    summary: `Sent email to ${args.payload.to}`,
    destination: args.payload.to,
    subject: args.payload.subject,
    timestamp: args.executedAt,
    providerMessageId: messageId,
    traceId: args.traceId,
    approvalId: args.approvalId,
  };
  await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf-8");

  return { messageId, receiptPath };
}
