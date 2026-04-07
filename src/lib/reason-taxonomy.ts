export type BlockReasonCode =
  | "STEP_UP_REQUIRED"
  | "KIND_NOT_ALLOWLISTED"
  | "REPO_DIRTY"
  | "REPO_ROOT_MISSING"
  | "CONNECTOR_NOT_ALLOWLISTED"
  | "INGRESS_SIGNATURE_INVALID"
  | "INGRESS_TIMESTAMP_INVALID"
  | "INGRESS_NONCE_REPLAY"
  | "APPROVAL_REQUIRED"
  | "POLICY_DENIED";

export type ReasonDetail = {
  code: BlockReasonCode;
  label: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  source: "ingress" | "approval" | "policy" | "execution";
};

const REASONS: Record<BlockReasonCode, ReasonDetail> = {
  STEP_UP_REQUIRED: {
    code: "STEP_UP_REQUIRED",
    label: "Step-up required",
    summary: "Execution blocked until operator re-authenticates.",
    severity: "warning",
    source: "policy",
  },
  KIND_NOT_ALLOWLISTED: {
    code: "KIND_NOT_ALLOWLISTED",
    label: "Kind not allowlisted",
    summary: "Action kind is not allowed by execution policy.",
    severity: "critical",
    source: "policy",
  },
  REPO_DIRTY: {
    code: "REPO_DIRTY",
    label: "Repo dirty",
    summary: "Working tree has uncommitted changes. Commit or stash first.",
    severity: "warning",
    source: "execution",
  },
  REPO_ROOT_MISSING: {
    code: "REPO_ROOT_MISSING",
    label: "Repo root missing",
    summary: "JARVIS_REPO_ROOT is missing or invalid.",
    severity: "critical",
    source: "execution",
  },
  CONNECTOR_NOT_ALLOWLISTED: {
    code: "CONNECTOR_NOT_ALLOWLISTED",
    label: "Connector not allowlisted",
    summary: "Connector is not in trusted ingress allowlist.",
    severity: "critical",
    source: "ingress",
  },
  INGRESS_SIGNATURE_INVALID: {
    code: "INGRESS_SIGNATURE_INVALID",
    label: "Signature invalid",
    summary: "Ingress signature verification failed.",
    severity: "critical",
    source: "ingress",
  },
  INGRESS_TIMESTAMP_INVALID: {
    code: "INGRESS_TIMESTAMP_INVALID",
    label: "Timestamp invalid",
    summary: "Ingress timestamp is outside allowed time window.",
    severity: "warning",
    source: "ingress",
  },
  INGRESS_NONCE_REPLAY: {
    code: "INGRESS_NONCE_REPLAY",
    label: "Nonce replay",
    summary: "Ingress nonce was already seen.",
    severity: "critical",
    source: "ingress",
  },
  APPROVAL_REQUIRED: {
    code: "APPROVAL_REQUIRED",
    label: "Approval required",
    summary: "Action cannot execute without explicit human approval.",
    severity: "info",
    source: "approval",
  },
  POLICY_DENIED: {
    code: "POLICY_DENIED",
    label: "Policy denied",
    summary: "Execution blocked by policy.",
    severity: "warning",
    source: "policy",
  },
};

export function getReasonDetail(code: BlockReasonCode): ReasonDetail {
  return REASONS[code];
}

export function reasonFromPolicyReason(reason: string): ReasonDetail {
  if (reason === "reauthenticate_required") return getReasonDetail("STEP_UP_REQUIRED");
  if (reason === "adapter_not_permitted") return getReasonDetail("KIND_NOT_ALLOWLISTED");
  if (reason === "dirty_worktree") return getReasonDetail("REPO_DIRTY");
  if (reason === "repo_root_required") return getReasonDetail("REPO_ROOT_MISSING");
  return getReasonDetail("POLICY_DENIED");
}

export function reasonFromMessage(message: string): ReasonDetail {
  const m = message.toLowerCase();
  if (m.includes("step-up")) return getReasonDetail("STEP_UP_REQUIRED");
  if (m.includes("allowlist")) return getReasonDetail("KIND_NOT_ALLOWLISTED");
  if (m.includes("dirty")) return getReasonDetail("REPO_DIRTY");
  if (m.includes("repo_root")) return getReasonDetail("REPO_ROOT_MISSING");
  if (m.includes("approval")) return getReasonDetail("APPROVAL_REQUIRED");
  return getReasonDetail("POLICY_DENIED");
}
