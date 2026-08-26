import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile, saveProfile } from "@/lib/data";
import { DEFAULT_BRAND, FALLBACK_PALETTES, allStock, getStockById, persistBrand } from "@/lib/schools";
import { compressImageFile, initialsFromName } from "@/lib/utils";
import type { ChildGender, UserProfile, UserRole } from "@/lib/types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [schoolSelect, setSchoolSelect] = useState("studious");
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [forChild, setForChild] = useState(false);
  const [childAge, setChildAge] = useState<string>("");
  const [childGender, setChildGender] = useState<ChildGender | "">("");
  const [customName, setCustomName] = useState("");
  const [paletteId, setPaletteId] = useState("studious");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    void getProfile().then((p) => {
      setPhone(p.phone);
      setSmsAlerts(p.smsAlerts);
      setSchoolSelect(p.schoolSelect);
      setAvatar(p.avatarDataUrl || "");
      setRole(p.role === "both" ? "student" : p.role);
      setForChild(Boolean(p.forChild));
      setChildAge(p.childAge != null ? String(p.childAge) : "");
      setChildGender(p.childGender || "");
      setCustomName(p.customSchoolName || "");
      setPaletteId(p.paletteId || "studious");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ageNum = childAge.trim() === "" ? null : Number(childAge);
    const kidsMode =
      role === "student" && (forChild || (ageNum != null && !Number.isNaN(ageNum) && ageNum <= 9));
    const next: UserProfile = {
      displayName: user?.displayName,
      phone,
      smsAlerts,
      schoolSelect,
      paletteId,
      customSchoolName: customName,
      avatarDataUrl: avatar,
      role,
      edition: role === "teacher" ? "teacher" : role === "professional" ? "professional" : "student",
      setupComplete: true,
      forChild: role === "student" ? forChild : false,
      childAge: role === "student" ? ageNum : null,
      childGender: role === "student" && (childGender === "boy" || childGender === "girl") ? childGender : null,
      kidsMode,
    };
    await saveProfile({ data: next });
    if (schoolSelect === "custom") {
      const pal = FALLBACK_PALETTES.find((p) => p.id === paletteId) || FALLBACK_PALETTES[0];
      persistBrand({ ...DEFAULT_BRAND, id: "custom", name: customName || "Custom", primary: pal.primary, accent: pal.accent, initials: initialsFromName(customName || "CS"), kind: "custom" });
    } else {
      persistBrand(getStockById(schoolSelect) || DEFAULT_BRAND);
    }
    // Apply kids skin immediately for local testing
    document.documentElement.classList.toggle("kids-mode", Boolean(kidsMode));
    document.documentElement.classList.toggle("kids-boy", Boolean(kidsMode && next.childGender === "boy"));
    document.documentElement.classList.toggle("kids-girl", Boolean(kidsMode && next.childGender === "girl"));
    setSaving(false);
    if (next.edition === "teacher") await navigate({ to: "/coming-soon" });
    else if (next.role === "professional" || next.edition === "professional") await navigate({ to: "/meetings" });
    else await navigate({ to: "/dashboard" });
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don’t match.");
      return;
    }
    setPwBusy(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPwBusy(false);
    if (error) {
      setPwError(error.message || "Could not change password. Sign in with email to use this.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwMsg("Password updated.");
  }

  const name = user?.displayName || "Student";
  const email = user?.primaryEmail || "";

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-xl space-y-5">
        <p className="text-xs font-medium text-teal">App update: August 20</p>
        <form onSubmit={handleSave} className="card-surface space-y-5 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-teal text-lg font-semibold text-white">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initialsFromName(name)}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Profile photo</label>
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="text-xs"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setAvatar(await compressImageFile(f, 240));
                }}
              />
              {avatar && (
                <button type="button" className="mt-1 block text-[11px] text-muted" onClick={() => setAvatar("")}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <ReadOnly label="Name" value={name} />
          <ReadOnly label="Email" value={email} />
          <div>
            <label className="mb-1 block text-xs text-muted">Account type</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
              value={role}
              onChange={(e) => {
                const next = e.target.value as UserRole;
                setRole(next);
                if (next !== "student") {
                  setForChild(false);
                  setChildAge("");
                  setChildGender("");
                }
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="professional">Professional</option>
              <option value="theologian">Theologian</option>
            </select>
            <p className="mt-1 text-[11px] text-muted">
              Teacher, Professional, and Theologian modes will be customized later. Core study tools work for all types
              now.
            </p>
          </div>
          {role === "student" && (
            <div className="space-y-3 rounded-xl border border-border bg-bg p-3">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={forChild}
                  onChange={(e) => setForChild(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Create for child</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Parent is setting up this account for a child. Ages 9 and under use Kids Mode.
                  </span>
                </span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">Child age</label>
                  <input
                    type="number"
                    min={3}
                    max={18}
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Boy or girl</label>
                  <select
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    value={childGender}
                    onChange={(e) => setChildGender(e.target.value as ChildGender | "")}
                  >
                    <option value="" disabled>
                      Choose one
                    </option>
                    <option value="boy">Boy (blue theme)</option>
                    <option value="girl">Girl (pink theme)</option>
                  </select>
                </div>
              </div>
              {(forChild || (childAge !== "" && Number(childAge) <= 9)) && (
                <p className="text-xs text-teal">
                  Kids Mode will be on{childGender === "boy" ? " with a blue skin" : childGender === "girl" ? " with a pink skin" : ""}.
                  Layout and tools will keep getting friendlier for this age group.
                </p>
              )}
            </div>
          )}
          <div className={role === "professional" ? "opacity-50" : ""}>
            <label className="mb-1 block text-xs text-muted">School</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-bg"
              value={schoolSelect}
              onChange={(e) => setSchoolSelect(e.target.value)}
              disabled={role === "professional"}
            >
              <option value="studious">Studious default</option>
              <optgroup label="Colleges">
                {allStock()
                  .filter((s) => s.kind === "college")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="High schools">
                {allStock()
                  .filter((s) => s.kind === "high-school")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <option value="custom">Custom</option>
            </select>
            {role === "professional" && (
              <p className="mt-1 text-[11px] text-muted">School branding is not used for Professional accounts.</p>
            )}
          </div>
          {schoolSelect === "custom" && (
            <div className={role === "professional" ? "opacity-50" : ""}>
              <label className="mb-1 block text-xs text-muted">Custom school name</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-bg"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                disabled={role === "professional"}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-muted">Phone number</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(318) 555-0100"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
            Send me text alerts for upcoming assignments and tests
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>

        <form onSubmit={handlePassword} className="card-surface space-y-3 rounded-xl p-5 sm:p-6">
          <h2 className="text-base font-semibold">Change password</h2>
          <p className="text-xs text-muted">
            For email accounts. Google / X sign-in manages passwords with that provider.
          </p>
          <PwField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PwField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PwField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {pwError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{pwError}</p>}
          {pwMsg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-green">{pwMsg}</p>}
          <Button type="submit" disabled={pwBusy}>
            {pwBusy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm" value={value} readOnly />
    </div>
  );
}

function PwField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        type="password"
        required
        minLength={8}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
