import { RouteApp } from "@/components/RouteApp";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 h-12 flex items-center px-4 bg-white border-b border-gray-200 gap-3">
        <svg className="w-6 h-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="38" r="18" stroke="currentColor" strokeWidth="3"/>
          <circle cx="52" cy="48" r="8" stroke="currentColor" strokeWidth="3"/>
          <circle cx="22" cy="38" r="2" fill="currentColor"/>
          <circle cx="52" cy="48" r="1.5" fill="currentColor"/>
          <line x1="22" y1="38" x2="38" y2="18" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="38" y1="18" x2="52" y2="48" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="35" y1="14" x2="41" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="22" cy="38" r="4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <h1 className="font-bold text-gray-900 text-base">PennyFarething</h1>
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
