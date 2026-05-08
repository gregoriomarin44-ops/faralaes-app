import NavBar from "./NavBar";

type LegalSection = {
  title: string;
  body: string;
};

export default function LegalText({
  intro,
  sections,
  title,
}: {
  intro: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-white px-6 py-12">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Legal
          </p>
          <h1 className="mt-3 font-serif text-4xl text-stone-950 md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 leading-7 text-stone-600">{intro}</p>

          <div className="mt-8 space-y-5 rounded-lg border border-stone-200 bg-[#f8f3ef] p-6 text-stone-700">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-2xl text-stone-950">
                  {section.title}
                </h2>
                <p className="mt-2 leading-7">{section.body}</p>
              </section>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
