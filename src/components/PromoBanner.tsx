function PromoBanner() {
  return (
    <section className="bg-[#111111] py-16 text-white">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-8 rounded-3xl bg-linear-to-r from-orange-500 to-orange-600 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-100">
              Limited Time Offer
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Up to 40% off on seasonal essentials
            </h2>
          </div>

          <a
            href="#products"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Shop the Sale
          </a>
        </div>
      </div>
    </section>
  );
}

export default PromoBanner;
