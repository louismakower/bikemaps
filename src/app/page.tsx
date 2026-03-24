import { RouteApp } from "@/components/RouteApp";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 h-12 flex items-center px-4 bg-white border-b border-gray-200 gap-3">
        <span className="text-xl">🚴</span>
        <h1 className="font-bold text-gray-900 text-base">Brompton</h1>
        <span className="text-xs text-gray-400 hidden sm:block">
          Bike + transit navigation for London
        </span>
      </header>

      {/* Main: full remaining height */}
      <main className="flex-1 overflow-hidden">
        <RouteApp />
      </main>
    </div>
  );
}
