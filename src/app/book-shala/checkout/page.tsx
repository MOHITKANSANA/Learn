import { BookCheckoutForm } from '@/components/book-checkout-form';

export default function CheckoutPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Complete your purchase by filling out the details below.
        </p>
      </div>
      <BookCheckoutForm />
    </div>
  );
}
