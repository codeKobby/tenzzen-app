# Billing Implementation with shadcn

## Overview

The billing page provides subscription management, payment methods, and invoice history using shadcn components.

## Key Components Used

- Card
- Button
- Dialog
- Form
- Separator
- Alert
- Badge
- Select
- Icons

## Implementation

```tsx
// app/(dashboard)/billing/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, FileText, History, Shield, Check } from "lucide-react"
import { PlanSelectionDialog } from "./components/plan-selection-dialog"
import { PaymentMethodDialog } from "./components/payment-method-dialog"
import { RemovePaymentDialog } from "./components/remove-payment-dialog"

export default function BillingPage() {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentToRemove, setPaymentToRemove] = useState<PaymentMethod | null>(null)

  const { data: billing } = useBillingData()

  return (
    <div className="container space-y-8 py-8">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      <div className="grid gap-8 max-w-4xl">
        {/* Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Current Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                {billing?.plan.name} ({billing?.plan.interval}ly billing)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPlanDialog(true)}>
                Change Plan
              </Button>
              <Button>Manage Subscription</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-start pb-4 border-b">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">
                  ${billing?.plan.price}/{billing?.plan.interval}
                </h3>
                {billing?.plan.interval === 'year' && (
                  <p className="text-sm text-muted-foreground">
                    Save 20% with annual billing
                  </p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {billing?.plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Payment Methods</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your payment methods
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowPaymentDialog(true)}>
              Add Payment Method
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing?.paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-md bg-secondary/50">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">•••• {method.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiryDate}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod(method.id)}
                    >
                      Make Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentToRemove(method)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Billing History</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and download your invoices
              </p>
            </div>
            <Button variant="outline">Download All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billing?.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{invoice.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(invoice.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        ${invoice.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(invoice.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your payment information is processed securely. We never store complete
            card details.
          </AlertDescription>
        </Alert>
      </div>

      <PlanSelectionDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
      />
      
      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
      
      <RemovePaymentDialog
        open={!!paymentToRemove}
        onOpenChange={() => setPaymentToRemove(null)}
        paymentMethod={paymentToRemove}
      />
    </div>
  )
}
```

## Features

1. **Plan Management**
   - Current plan display
   - Plan switching
   - Feature comparison
   - Billing cycle options

2. **Payment Methods**
   - Multiple cards
   - Default payment selection
   - Card removal
   - Secure handling

3. **Invoice History**
   - Transaction listing
   - Receipt downloads
   - Status tracking
   - Amount details

4. **Security Elements**
   - Secure forms
   - Payment confirmation
   - Error handling
   - Loading states

## Usage Examples

### Plan Selection Dialog
```tsx
interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlanSelectionDialog({
  open,
  onOpenChange
}: PlanSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Change Plan</DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "cursor-pointer transition-colors hover:border-primary",
                plan.popular && "border-primary"
              )}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {/* Plan details */}
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Payment Method Form
```tsx
export function PaymentMethodForm() {
  const form = useForm<PaymentFormData>()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="4242 4242 4242 4242" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other form fields */}
      </form>
    </Form>
  )
}
```

This implementation provides a comprehensive billing management interface using shadcn components while maintaining security and user experience best practices.