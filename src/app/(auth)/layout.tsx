import { Package, QrCode, BarChart3, Shield } from "lucide-react";

const FEATURES = [
  { icon: Package, text: "Pendataan barang dengan kode unik & QR" },
  { icon: QrCode, text: "Scan Cepat untuk verifikasi fisik real-time" },
  { icon: BarChart3, text: "Laporan inventaris akurat & ekspor manual" },
  { icon: Shield, text: "5 role terdesentralisasi, aman & transparan" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      {/* Kiri — gradient brand + fitur */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-linear-to-br from-[#4F46E5] to-[#7C3AED] p-12 text-white flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Package className="size-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Inventaris Fakultas</span>
          </div>
          <p className="text-white/70 text-sm">Universitas Sebelas Maret</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight leading-tight xl:text-4xl">
            Kelola inventaris
            <br />
            fakultas dengan
            <br />
            <span className="text-white/90">akurat & real-time.</span>
          </h1>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="size-4" />
                </div>
                <span className="text-sm text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          &copy; {new Date().getFullYear()} Sistem Inventaris Barang — UNS
        </p>

        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />
      </div>

      {/* Kanan — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Package className="size-4" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">Inventaris Fakultas</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
