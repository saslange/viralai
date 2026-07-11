"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-xl font-semibold text-neutral-50">heysash85 · viral lab</h1>
        <p className="mt-1 text-sm text-neutral-400">
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
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={status === "busy"}
              className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {status === "busy" ? "Sende Code…" : "Login-Code senden"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-3">
            <p className="text-sm text-emerald-400">
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
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-center text-lg tracking-[0.3em] text-neutral-100 outline-none focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={status === "busy"}
              className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
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
              className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300"
            >
              Andere Email verwenden
            </button>
          </form>
        )}

        {status === "error" && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <p className="mt-4 text-xs text-neutral-600">
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
