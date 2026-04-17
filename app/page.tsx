import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  CircleCheckBig,
  Smartphone,
  Sparkles,
  Zap,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"

// Simulación de badges de tiendas (puedes reemplazarlos con SVGs reales o imágenes)
const AppStoreBadge = () => (
  <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-background transition-transform hover:scale-105 cursor-pointer">
    <Smartphone className="size-5" />
    <div className="text-left">
      <p className="text-[10px] leading-none uppercase">Download on the</p>
      <p className="text-sm font-bold leading-none">App Store</p>
    </div>
  </div>
)

const PlayStoreBadge = () => (
  <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-background transition-transform hover:scale-105 cursor-pointer">
    <LayoutGrid className="size-5" />
    <div className="text-left">
      <p className="text-[10px] leading-none uppercase">Get it on</p>
      <p className="text-sm font-bold leading-none">Google Play</p>
    </div>
  </div>
)

const beneficios = [
  {
    title: "Plan Inteligente",
    description: "Rutas personalizadas según tu carrera y universidad (Áreas A, B, C, D).",
    icon: Zap,
    color: "bg-lime-400"
  },
  {
    title: "Feedback Real",
    description: "Entiende tus errores al instante con explicaciones guiadas por IA.",
    icon: CircleCheckBig,
    color: "bg-cyan-400"
  },
  {
    title: "Gamificación",
    description: "Rachas y desafíos diarios para que estudiar no sea aburrido.",
    icon: Sparkles,
    color: "bg-purple-500"
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-background font-sans selection:bg-lime-400 selection:text-black">

      {/* HEADER - Minimalista estilo InDrive */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tighter text-foreground italic">
            YALAS<span className="text-lime-500">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="font-bold">Soporte</Button>
            <Button className="bg-lime-400 font-bold text-black hover:bg-lime-500">
              Descargar App
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Alto impacto */}
      <section className="relative overflow-hidden px-6 py-16 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="z-10 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600 border border-lime-400/20">
              <ShieldCheck className="size-3" /> Preparación UNSAAC 2026
            </div>
            <h1 className="text-5xl font-black leading-[0.9] tracking-tighter text-foreground md:text-8xl">
              TU INGRESO <br />
              <span className="text-lime-400 underline decoration-black italic">A UN TAP.</span>
            </h1>
            <p className="max-w-md text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
              Deja de estudiar a ciegas. Únete a la plataforma de alto rendimiento para futuros universitarios en Perú.
            </p>

            <div className="flex flex-wrap gap-4">
              <AppStoreBadge />
              <PlayStoreBadge />
            </div>
          </div>

          {/* MOCKUP VISUAL - Estilo Glassmorphism */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[3rem] bg-lime-400/20 blur-3xl" />
            <div className="relative rounded-[2.5rem] border-8 border-foreground bg-card p-4 shadow-2xl">
              <div className="space-y-4 rounded-[1.5rem] bg-background p-6">
                <div className="flex justify-between items-center">
                  <p className="font-black text-xl italic">MI PROGRESO</p>
                  <div className="px-2 py-1 bg-lime-400 text-[10px] font-bold rounded">LIVE</div>
                </div>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-lime-400 w-[75%]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-secondary rounded-2xl border-2 border-lime-400/50">
                    <p className="text-2xl font-black italic">84%</p>
                    <p className="text-[10px] uppercase font-bold opacity-60">Letras</p>
                  </div>
                  <div className="p-4 bg-foreground text-background rounded-2xl">
                    <p className="text-2xl font-black italic">92%</p>
                    <p className="text-[10px] uppercase font-bold opacity-60">Ciencias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - Tarjetas de colores sólidos */}
      <section className="bg-foreground py-20 text-background">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-4xl font-black tracking-tighter md:text-6xl italic">POR QUÉ YALAS ES DIFERENTE</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {beneficios.map((item) => (
              <div key={item.title} className={`${item.color} p-8 rounded-[2rem] text-black group hover:-rotate-2 transition-transform cursor-default`}>
                <item.icon className="size-10 mb-6" />
                <h3 className="text-2xl font-black leading-tight mb-2 uppercase italic">{item.title}</h3>
                <p className="font-medium opacity-80">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAs FINALES */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl rounded-[3rem] bg-lime-400 p-12 text-center text-black">
          <h2 className="text-4xl font-black tracking-tighter md:text-6xl mb-6 italic uppercase">¿Listo para asegurar tu vacante?</h2>
          <p className="text-xl font-bold mb-10 max-w-xl mx-auto opacity-70">
            Descarga la app ahora y obtén un diagnóstico gratuito de tu nivel académico actual.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="scale-125">
              <PlayStoreBadge />
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-muted-foreground text-sm border-t font-bold">
        © 2026 YALAS
      </footer>
    </main>
  )
}