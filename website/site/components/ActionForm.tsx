"use client";
import { useActionState, useEffect, useRef } from "react";
import { Turnstile } from "./Turnstile";

export type FormState = { ok: boolean; msg: string; extra?: string };
type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  lang: string;
  submitLabel: string;
  turnstile?: boolean;
  resetOnOk?: boolean;
  hideOnOk?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Formulier dat een serveractie aanroept en het antwoord van de server toont. */
export function ActionForm({ action, lang, submitLabel, turnstile = false, resetOnOk = true, hideOnOk = false, className, children }: Props) {
  const [state, formAction, pending] = useActionState(action, { ok: false, msg: "" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.msg) return;
    if (state.ok && resetOnOk) ref.current?.reset();
    window.turnstile?.reset();
  }, [state, resetOnOk]);
  if (state.ok && hideOnOk) return <p className="ok" role="status">{state.msg}</p>;
  return (
    <form ref={ref} action={formAction} className={className} style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="lang" value={lang} />
      {children}
      {turnstile && <Turnstile />}
      <div><button className="btn bl" type="submit" disabled={pending}>{submitLabel}</button></div>
      {state.msg && <p className={state.ok ? "ok" : "err"} role={state.ok ? "status" : "alert"}>{state.msg}</p>}
    </form>
  );
}
