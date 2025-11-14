import FeaturePreview from "./FeaturePreview.jsx";

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  previewVariant = "scroll",
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_60%)]" />
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-white/10 bg-slate-900/60 p-4 shadow-2xl shadow-indigo-900/40 backdrop-blur lg:grid-cols-[1fr_0.9fr] lg:p-8">
        <FeaturePreview variant={previewVariant} />

        <section className="order-1 rounded-3xl bg-slate-950/60 p-5 shadow-lg shadow-black/30 ring-1 ring-white/5 lg:order-2 lg:p-7">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
              Hust Collab Platform
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white lg:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-3 text-base text-slate-300">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-slate-400">{footer}</div>}
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
