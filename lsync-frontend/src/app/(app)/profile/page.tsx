"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextAreaField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { USE_MOCKS } from "@/lib/api/endpoints";
import { resetMockData } from "@/lib/api/mock";
import { getProfile, saveAvatarToServer, saveProfile } from "@/lib/api/services";
import { Avatar } from "@/components/ui/Avatar";
import { fileToAvatar, useAvatar, writeAvatar } from "@/lib/avatar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAsync } from "@/lib/hooks/useAsync";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  headline: z.string().trim().max(120, "Keep it under 120 characters."),
  about: z.string().trim().max(600, "Keep it under 600 characters."),
});
type Values = z.infer<typeof schema>;

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "visibility", label: "Portfolio visibility" },
  { id: "account", label: "Account" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const profile = useAsync(getProfile);
  const [tab, setTab] = useState<Tab>("profile");
  const [interests, setInterests] = useState<string[] | null>(null);
  const [newInterest, setNewInterest] = useState("");
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [visBusy, setVisBusy] = useState(false);
  const [pendingPublic, setPendingPublic] = useState<boolean | null>(null);
  const [visError, setVisError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const who = (user?.id as string | undefined) ?? user?.email ?? user?.username;

  const p = profile.data;
  const list = interests ?? p?.interests ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: p ? { fullName: p.fullName ?? "", headline: p.headline ?? "", about: p.about ?? "" } : undefined,
  });

  async function onSubmit(v: Values) {
    setServerError(null);
    setSaved(false);
    try {
      await saveProfile({ fullName: v.fullName, headline: v.headline, about: v.about, interests: list });
      updateUser({ fullName: v.fullName });
      setInterests(null);
      setSaved(true);
      profile.reload();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "We couldn't save your changes.");
    }
  }

  function addInterest() {
    const v = newInterest.trim();
    if (!v || list.some((i) => i.toLowerCase() === v.toLowerCase()) || list.length >= 12) return;
    setInterests([...list, v]);
    setNewInterest("");
  }

  async function togglePublic() {
    if (!p) return;
    const next = !(pendingPublic ?? p.isPublic);
    setPendingPublic(next); // flip immediately; undo if the server says no
    setVisBusy(true);
    setVisError(null);
    try {
      await saveProfile({ isPublic: next });
      profile.reload();
    } catch (e) {
      setPendingPublic(null);
      setVisError(e instanceof Error ? e.message : "We couldn't change your visibility.");
    } finally {
      setVisBusy(false);
    }
  }

  const photo = useAvatar(who, p?.avatar);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!file || !who) return;
    setPhotoBusy(true);
    setPhotoMsg(null);
    try {
      const dataUrl = await fileToAvatar(file);
      writeAvatar(who, dataUrl); // shows everywhere straight away
      const sent = await saveAvatarToServer(dataUrl);
      setPhotoMsg({ tone: "ok", text: sent ? "Your photo is saved." : "Your photo is saved on this device." });
    } catch (err) {
      setPhotoMsg({ tone: "error", text: err instanceof Error ? err.message : "We couldn't use that picture." });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    if (!who) return;
    writeAvatar(who, null);
    await saveAvatarToServer(null);
    setPhotoMsg({ tone: "ok", text: "Photo removed." });
  }

  const isPublic = pendingPublic ?? p?.isPublic ?? false;
  const displayName = p?.fullName || user?.fullName || user?.username;
  const portfolioPath = p?.username ? `/portfolio/${p.username}` : null;

  return (
    <>
      <PageHeader title="Profile and settings" />
      <p className="mb-4 max-w-2xl text-body">Edit your details, choose what&apos;s public, and manage your account.</p>

      <div role="tablist" aria-label="Settings sections" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab === t.id ? "border-indigo-brand bg-lilac-soft text-indigo-brand" : "border-black/10 bg-white text-body hover:bg-black/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {profile.loading && !p && <Loading label="Loading your profile" />}
      {profile.error && (
        <Banner tone="error" action={<Button type="button" variant="outline" onClick={profile.reload} className="!px-4 !py-2 !text-sm">Try again</Button>}>
          {profile.error}
        </Banner>
      )}

      {p && tab === "profile" && (
        <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">
          <Card title="Profile details">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={displayName} src={photo} className="size-20 text-2xl" />
                <div>
                  <input ref={fileRef} id="photo-input" type="file" accept="image/*" className="sr-only" onChange={onPickPhoto} tabIndex={-1} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" loading={photoBusy} onClick={() => fileRef.current?.click()} className="!py-2 text-sm">
                      {photo ? "Change photo" : "Upload photo"}
                    </Button>
                    {photo && (
                      <Button type="button" variant="outline" onClick={() => void onRemovePhoto()} className="!py-2 text-sm">
                        Remove photo
                      </Button>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-muted">JPG, PNG or WebP. We crop it to a square and make it small, so it loads fast.</p>
                  {photoMsg && (
                    <p role={photoMsg.tone === "error" ? "alert" : "status"} className={`mt-1.5 text-sm font-medium ${photoMsg.tone === "error" ? "text-danger" : "text-success"}`}>
                      {photoMsg.text}
                    </p>
                  )}
                </div>
              </div>

              {saved && <Banner tone="success">Your profile has been saved.</Banner>}
              <FormAlert message={serverError} />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
                <TextField label="Username" value={p.username ?? ""} readOnly hint={portfolioPath ? `Your public link: ${portfolioPath}` : undefined} />
              </div>
              <TextField label="Headline" placeholder="For example: Product designer building skills in data" error={errors.headline?.message} {...register("headline")} />
              <TextAreaField label="About" hint="A few sentences about what you're learning and why." error={errors.about?.message} {...register("about")} />
              <TextField label="Email" value={p.email ?? ""} readOnly hint="Your email is never shown on your public portfolio." />

              <fieldset>
                <legend className="mb-2 text-base font-semibold text-ink">Learning interests</legend>
                <ul className="flex flex-wrap gap-2">
                  {list.map((i) => (
                    <li key={i} className="inline-flex items-center gap-1 rounded-full bg-lilac-soft py-1 pl-3.5 pr-1.5 text-sm font-semibold text-indigo-brand">
                      {i}
                      <button type="button" aria-label={`Remove ${i}`} onClick={() => setInterests(list.filter((x) => x !== i))} className="grid size-6 place-items-center rounded-full hover:bg-indigo-brand/10">
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex max-w-sm gap-2">
                  <label htmlFor="new-interest" className="sr-only">
                    Add an interest
                  </label>
                  <input
                    id="new-interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterest();
                      }
                    }}
                    maxLength={40}
                    placeholder="Add an interest"
                    className="min-w-0 flex-1 rounded-xl border border-peach bg-[#f7f5f6] px-3.5 py-2.5"
                  />
                  <Button type="button" variant="outline" onClick={addInterest} className="!py-2.5 text-sm">
                    Add
                  </Button>
                </div>
              </fieldset>

              <div className="flex gap-3">
                <Button type="submit" loading={isSubmitting}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {p && tab === "visibility" && (
        <div role="tabpanel" id="panel-visibility" aria-labelledby="tab-visibility">
          <Card title="Portfolio visibility" subtitle="Control whether anyone with your link can see your portfolio.">
            <div className="flex items-start justify-between gap-4 rounded-xl bg-[#f6f4fa] p-4">
              <div>
                <p id="public-label" className="font-bold text-ink">
                  Make my portfolio public
                </p>
                <p className="mt-0.5 text-sm text-body">{isPublic ? "Anyone with your link can view it." : "Only you can see it right now."}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-labelledby="public-label"
                disabled={visBusy}
                onClick={togglePublic}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${isPublic ? "bg-indigo-brand" : "bg-black/25"}`}
              >
                <span className={`absolute top-1 size-6 rounded-full bg-white transition-all ${isPublic ? "left-7" : "left-1"}`} />
              </button>
            </div>
            {visError && (
              <div className="mt-3">
                <Banner tone="error">{visError}</Banner>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <Banner tone="warn">The public portfolio page isn&apos;t live yet, and private-repository protection is still being finished. Turning this on won&apos;t publish anything today.</Banner>
              <p className="text-sm text-muted">Choosing which sources appear on your portfolio is coming soon.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "account" && (
        <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" className="flex flex-col gap-4">
          <Card title="Account">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-ink">Log out</p>
                <p className="text-sm text-muted">Sign out of LSync on this device.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="!py-2.5 text-sm"
              >
                <LogOut className="size-4" aria-hidden /> Log out
              </Button>
            </div>
          </Card>

          <ChangePasswordCard />

          <DeleteAccount
            onDeleted={() => {
              logout();
              router.replace("/register");
            }}
          />

          {USE_MOCKS && (
            <Card title="Demo data" subtitle="Only shown in demo mode">
              <p className="mb-3 text-sm text-body">Everything you add in demo mode lives in this browser. Reset to bring the sample data back and sign out.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetMockData();
                  logout();
                  router.replace("/login");
                }}
                className="!py-2.5 text-sm"
              >
                Reset demo data
              </Button>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
