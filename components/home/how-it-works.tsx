import { UserPlus, Search, Droplet, Heart } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Register",
    description: "Create your donor profile with your blood group and contact details.",
  },
  {
    icon: Search,
    title: "Get Matched",
    description: "Our system matches donors with patients based on blood type and location.",
  },
  {
    icon: Droplet,
    title: "Donate",
    description: "Visit a nearby hospital or blood bank to complete your donation safely.",
  },
  {
    icon: Heart,
    title: "Save Lives",
    description: "Your single donation can save up to three lives. Track your impact.",
  },
]

export function HowItWorks() {
  return (
    <section className="bg-card py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Four simple steps to become a life-saver
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border lg:block" />
              )}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
