import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ConfirmationContext = createContext<(message: string) => Promise<boolean>>(() => Promise.resolve(false));
export const useConfirmation = () => useContext(ConfirmationContext);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resolve = useRef<((accepted: boolean) => void) | null>(null);
  const confirm = useCallback((text: string) => new Promise<boolean>((done) => {
    resolve.current?.(false);
    resolve.current = done;
    setMessage(text);
  }), []);
  const finish = (accepted: boolean) => {
    dialog.current?.close();
    resolve.current?.(accepted);
    resolve.current = null;
    setMessage(null);
  };
  useEffect(() => {
    if (message) dialog.current?.showModal();
    return () => dialog.current?.close();
  }, [message]);
  useEffect(() => () => { resolve.current?.(false); }, []);
  return <ConfirmationContext.Provider value={confirm}>
    {children}
    {message && <dialog ref={dialog} dir="rtl" aria-labelledby="confirmation-title"
      onCancel={(event) => { event.preventDefault(); finish(false); }}
      className="w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-violet-400/60 bg-zinc-950 p-6 text-center text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm">
      <h2 id="confirmation-title" className="text-lg font-black leading-8">{message}</h2>
      <div className="mt-6 flex gap-3">
        <button autoFocus type="button" onClick={() => finish(false)} className="min-h-12 flex-1 rounded-xl border border-zinc-600 font-bold">تراجع</button>
        <button type="button" onClick={() => finish(true)} className="min-h-12 flex-1 rounded-xl bg-white font-black text-black">تأكيد</button>
      </div>
    </dialog>}
  </ConfirmationContext.Provider>;
}
