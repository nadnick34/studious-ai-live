import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile, saveProfile } from "@/lib/data";
import { applyBrand, DEFAULT_BRAND, FALLBACK_PALETTES, allStock, getStockById } from "@/lib/schools";
import { compressImageFile, initialsFromName } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/lib/types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [schoolSelect, setSchoolSelect] = useState("studious");
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState<UserRole>("student");
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
      setRole(p.role);
      setCustomName(p.customSchoolName || "");
      setPaletteId(p.paletteId || "studious");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const next: UserProfile = {
      displayName: user?.displayName,
      phone,
      smsAlerts,
      schoolSelect,
      paletteId,
      customSchoolName: customName,
      avatarDataUrl: avatar,
      role,
      edition: role === "teacher" ? "teacher" : "student",
      setupComplete: true,
    };
    await saveProfile({ data: next });
    if (schoolSelect === "custom") {
      const pal = FALLBACK_PALETTES.find((p) => p.id === paletteId) || FALLBACK_PALETTES[0];
      applyBrand({ ...DEFAULT_BRAND, id: "custom", name: customName || "Custom", primary: pal.primary, accent: pal.accent, initials: initialsFromName(customName || "CS"), kind: "custom" });
    } else {
      const brand = getStockById(schoolSelect) || DEFAULT_BRAND;
      applyBrand(brand);
    }
    setSaving(false);
    if (next.edition === "teacher") await navigate({ to: "/coming-soon" });
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
            <label className="mb-1 block text-xs text-muted">I am a</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="both">Student & Teacher</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">School</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
              value={schoolSelect}
              onChange={(e) => setSchoolSelect(e.target.value)}
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
          </div>
          {schoolSelect === "custom" && (
            <div>
              <label className="mb-1 block text-xs text-muted">Custom school name</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
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
