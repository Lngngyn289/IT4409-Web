import FeaturePreview from "./FeaturePreview.jsx";

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  previewVariant = "scroll",
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-50 px-4 py-12 text-gray-800">
      <div className="relative mx-auto grid max-w-5xl gap-6 rounded-2xl border border-sky-100 bg-white p-4 shadow-lg lg:grid-cols-[1fr_0.9fr] lg:p-8">
        <FeaturePreview variant={previewVariant} />

        <section className="order-1 rounded-xl bg-gray-50 p-5 shadow-sm ring-1 ring-gray-200 lg:order-2 lg:p-7">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
              Hust Collab Platform
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 lg:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-3 text-base text-gray-600">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-gray-500">{footer}</div>}
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
