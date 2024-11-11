import Hero from "@/components/hero";

export default async function Index() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <div className="flex flex-col gap-2 items-center">
          <h2 className="font-medium text-xl mb-4">PEALEHT</h2>
        </div>
      </main>
    </>
  );
}