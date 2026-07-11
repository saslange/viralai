"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [status, setStatus] = useState<"idle" | "busy" | "sent" | "error">(
    callbackError ? "error" : "idle"
  );
  const [error, setError] = useState<string | null>(callbackError);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
    setStep("verify");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-300 bg-white p-8 shadow-xl shadow-neutral-300/40">
        <Logo className="text-lg text-neutral-900" />
        <p className="mt-2 text-sm text-neutral-500">
          Zugang nur für sash@heysash.de.
        </p>

        {step === "request" ? (
          <form onSubmit={handleRequest} className="mt-6 space-y-3">
            <input
              type="email"
              required
              placeholder="sash@heysash.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="submit"
              disabled={status === "busy"}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-neutral-400/30 transition hover:scale-[1.02] hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {status === "busy" ? "Sende Code…" : "Login-Code senden"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-3">
            <p className="text-sm text-emerald-600">
              Code an {email} verschickt — check dein Postfach (auch auf einem
              anderen Gerät möglich).
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              placeholder="6-stelliger Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-center text-lg tracking-[0.3em] text-neutral-900 outline-none focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="submit"
              disabled={status === "busy"}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-neutral-400/30 transition hover:scale-[1.02] hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {status === "busy" ? "Prüfe…" : "Einloggen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setStatus("idle");
                setError(null);
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-700"
            >
              Andere Email verwenden
            </button>
          </form>
        )}

        {status === "error" && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-xs text-neutral-400">
          Tipp: In der Mail steht auch ein klickbarer Link — der funktioniert
          aber nur auf dem Gerät, auf dem du ihn angefordert hast. Der Code
          oben geht auf jedem Gerät.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
