import { BottomNav } from "@/components/BottomNav";
import { Leaf } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6">
          <Leaf className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">About Us</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
          Coming soon — our story, mission, and the team behind Ethical Shopper.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
