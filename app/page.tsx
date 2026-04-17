import Link from "next/link"
import { ArrowRight, BookOpen, Brain, Clock3, Trophy, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

const mobileAppUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL

const highlights = [
  {
    title: "Smart study plans",
    description: "Follow a roadmap built for university admission goals.",
    icon: BookOpen,
  },
  {
    title: "Practice with feedback",
    description: "Answer real-style questions and get clear explanations.",
    icon: Brain,
  },
  {
    title: "Compete and stay motivated",
    description: "Track streaks, points, and progress with your group.",
    icon: Trophy,
  },
]

const quickStats = [
  { label: "Focused lessons", value: "Daily" },
  { label: "Practice sessions", value: "Weekly" },
  { label: "Group accountability", value: "Always" },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex w-fit items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              Built for pre-university students
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Yalas helps you prepare smarter for university admission.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Learn with focused content, solve guided questions, and keep momentum with a gamified study system.
              Everything is designed to help you stay consistent until exam day.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href={mobileAppUrl || "#mobile-app-coming-soon"}>
                  Start in the mobile app
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Create your account</Link>
              </Button>
            </div>
            {!mobileAppUrl ? (
              <p id="mobile-app-coming-soon" className="text-sm text-muted-foreground">
                Mobile app link coming soon. You can start now on web and we will connect your progress later.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-medium text-muted-foreground">Why students choose Yalas</p>
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex gap-3 rounded-lg border bg-background p-4">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border bg-card p-6 md:grid-cols-3">
          {quickStats.map((item) => (
            <div key={item.label} className="rounded-lg border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border bg-card p-5">
            <div className="mb-3 inline-flex rounded-md bg-primary/10 p-2 text-primary">
              <Clock3 className="size-4" />
            </div>
            <h3 className="font-semibold">Study in short blocks</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Daily learning sessions that fit around school and personal time.
            </p>
          </article>
          <article className="rounded-xl border bg-card p-5">
            <div className="mb-3 inline-flex rounded-md bg-primary/10 p-2 text-primary">
              <Users className="size-4" />
            </div>
            <h3 className="font-semibold">Progress with your group</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Stay accountable with classmates and follow a clear roadmap by group.
            </p>
          </article>
          <article className="rounded-xl border bg-card p-5">
            <div className="mb-3 inline-flex rounded-md bg-primary/10 p-2 text-primary">
              <Brain className="size-4" />
            </div>
            <h3 className="font-semibold">Learn the why behind answers</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Improve faster with explanations that help you avoid repeated mistakes.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
