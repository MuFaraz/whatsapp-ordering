import { DEMO_SLUG } from "@/config/site";

/** A phone frame showing the real, interactive demo menu. */
export function PhonePreview() {
  return (
    <div className="relative mx-auto w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 via-amber-200/40 to-transparent blur-2xl" />
      <div className="rounded-[2.75rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-white">
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
          <iframe
            src={`/menu/${DEMO_SLUG}`}
            title="Interactive demo menu"
            loading="lazy"
            className="block h-[580px] w-full"
          />
        </div>
      </div>
    </div>
  );
}
