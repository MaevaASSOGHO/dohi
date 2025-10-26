export const REPORT_STATUS = {
  in_review: { label: "En examen", cls: "text-yellow-200 border-yellow-800 bg-yellow-900/30" },
  validated: { label: "Validé",    cls: "text-emerald-300 border-emerald-800 bg-emerald-900/30" },
  rejected:  { label: "Refusé",    cls: "text-red-200 border-red-800 bg-red-900/30" },
};

export function statusLabel(s) {
  const key = String(s || "in_review").toLowerCase();
  return REPORT_STATUS[key]?.label ?? REPORT_STATUS.in_review.label;
}
export function statusBadgeClass(s) {
  const key = String(s || "in_review").toLowerCase();
  return REPORT_STATUS[key]?.cls ?? REPORT_STATUS.in_review.cls;
}
