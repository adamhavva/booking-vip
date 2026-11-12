"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import EmailVerificationBanner from "@/components/account/EmailVerificationBanner";
import { showToast } from "@/components/ui/toast";
import {
  changeAccountPassword,
  getAccountOverview,
  updateAccountProfile,
  type AccountOverviewDTO,
} from "@/app/actions/account";

/**
 * The profile page.
 *
 * Two blocks: the account information (name, email, phone, member since) and
 * the two forms — update the profile and change the password. The email is
 * read-only because it is the Firebase identity.
 */
export default function ProfilePanel() {
  const [overview, setOverview] = useState<AccountOverviewDTO | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileField, setProfileField] = useState<string | undefined>(undefined);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordField, setPasswordField] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    const data = await getAccountOverview();
    setOverview(data);
    if (data) {
      setName(data.name ?? "");
      setPhone(data.phone ?? "");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingProfile) return;

    setSavingProfile(true);
    setProfileError("");
    setProfileField(undefined);

    const result = await updateAccountProfile({ name, phone });
    if (!result.ok) {
      setProfileError(result.error);
      setProfileField(result.field);
    } else {
      showToast("Profil berhasil disimpan.");
      void load();
    }
    setSavingProfile(false);
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingPassword) return;

    setSavingPassword(true);
    setPasswordError("");
    setPasswordField(undefined);

    const result = await changeAccountPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.ok) {
      setPasswordError(result.error);
      setPasswordField(result.field);
    } else {
      showToast("Password berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const memberSince = overview?.memberSince
    ? new Date(overview.memberSince).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div>
      <AccountPageHeader
        title="Profil Saya"
        description="Informasi akun dan pengaturan keamanan."
      />

      <EmailVerificationBanner />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account information */}
        <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Informasi akun
          </h2>

          <dl className="mt-4 space-y-3.5">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13px] text-muted">Email</dt>
              <dd className="flex items-center gap-2 text-right text-[13px] font-medium text-ink">
                {overview?.email ?? "—"}
                {overview?.emailVerified ? (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-dark">
                    Terverifikasi
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13px] text-muted">Role</dt>
              <dd className="text-[13px] font-medium text-ink">Pelanggan</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13px] text-muted">Poin</dt>
              <dd className="text-[13px] font-medium text-ink">
                {(overview?.points ?? 0).toLocaleString("id-ID")}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[13px] text-muted">Bergabung sejak</dt>
              <dd className="text-right text-[13px] font-medium text-ink">{memberSince}</dd>
            </div>
          </dl>
        </section>

        {/* Update profile */}
        <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Update profil
          </h2>

          <form onSubmit={submitProfile} className="mt-4 space-y-3.5">
            {profileError ? (
              <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] text-danger">
                {profileError}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Nama</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                placeholder="Nama lengkap"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">
                Nomor telepon
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                placeholder="+62 812 3456 7890"
              />
            </label>

            <button
              type="submit"
              disabled={savingProfile}
              className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingProfile ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </form>
        </section>
      </div>

      {/* Password */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Update password
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Minimal 8 karakter. Password lama harus dimasukkan untuk verifikasi.
        </p>

        <form onSubmit={submitPassword} className="mt-4 grid gap-3.5 sm:grid-cols-3">
          {passwordError ? (
            <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] text-danger sm:col-span-3">
              {passwordError}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Password saat ini
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Password baru
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Konfirmasi password baru
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="h-10 rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
            >
              {savingPassword ? "Memperbarui…" : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
