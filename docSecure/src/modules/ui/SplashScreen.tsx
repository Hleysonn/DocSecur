type SplashScreenProps = {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-blue-500/70 animate-spin" />
          <div className="relative rounded-lg bg-blue-600/30 px-3 py-2 text-lg font-semibold text-blue-100 shadow-lg shadow-blue-500/20">
            SD
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-xl font-semibold mt-4 uppercase">SecureDocs</p>
          <p className="chgmt text-sm text-slate-300 mt-4">Chargement sécurisé en cours…</p>
        </div>
        <button
          onClick={onFinish}
          className="text-xs text-slate-400 underline decoration-dotted hover:text-slate-200"
        >
          Passer
        </button>
      </div>
    </div>
  )
}

