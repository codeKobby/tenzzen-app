"use client"

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-8">
      <div className="mx-auto max-w-[1500px] space-y-8 p-4 lg:p-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Billing</h1>
        <section className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            {/* Billing content will go here */}
          </div>
        </section>
      </div>
    </div>
  )
}