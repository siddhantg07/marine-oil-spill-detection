import Link from "next/link"
import { ArrowRight, Satellite, Shield, Zap, BarChart3, Globe, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Waves className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">OilSpillAI</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              AI-Powered Detection
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
              Marine Oil Spill Detection{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Using AI
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              AI-powered satellite image analysis for environmental monitoring. Detect and track 
              oil spills in real-time to protect our oceans and marine ecosystems.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-12 rounded-full px-8 text-base">
                  Start Detecting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base bg-transparent">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: "Scans Processed", value: "50K+" },
              { label: "Accuracy Rate", value: "99.2%" },
              { label: "Response Time", value: "<2s" },
              { label: "Active Users", value: "1,200+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Advanced AI capabilities for comprehensive marine monitoring
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Satellite,
                title: "Satellite Integration",
                description: "Process satellite imagery from multiple sources for comprehensive coverage of marine areas.",
              },
              {
                icon: Zap,
                title: "Real-time Detection",
                description: "Get instant results with our optimized AI models that process images in under 2 seconds.",
              },
              {
                icon: Shield,
                title: "High Accuracy",
                description: "Industry-leading 99.2% accuracy rate with continuous model improvements.",
              },
              {
                icon: BarChart3,
                title: "Detailed Analytics",
                description: "Track detection history, analyze trends, and generate comprehensive reports.",
              },
              {
                icon: Globe,
                title: "Global Coverage",
                description: "Monitor any ocean region worldwide with our extensive satellite network.",
              },
              {
                icon: Waves,
                title: "Environmental Impact",
                description: "Help protect marine ecosystems by enabling rapid response to oil spills.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 sm:px-12 sm:py-24">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl text-balance">
                Ready to protect our oceans?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                Join thousands of environmental researchers, coast guards, and organizations 
                using our AI platform to monitor and respond to oil spills.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="h-12 rounded-full px-8 text-base">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Waves className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">OilSpillAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 OilSpillAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
