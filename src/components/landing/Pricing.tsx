import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out SelfBiographer",
      features: [
        "1 profile",
        "3 bio generations per month",
        "Basic templates",
        "Public profile page",
        "Standard support",
      ],
      cta: "Get Started",
      variant: "hero-outline" as const,
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For professionals and personal brands",
      features: [
        "5 profiles",
        "Unlimited bio generations",
        "All premium templates",
        "Custom vanity URLs",
        "Press kit builder",
        "JSON-LD schema generator",
        "PDF & DOCX exports",
        "Priority support",
      ],
      cta: "Start Free Trial",
      variant: "hero" as const,
      popular: true,
    },
    {
      name: "Agency",
      price: "$79",
      period: "per month",
      description: "For teams and agencies",
      features: [
        "Unlimited profiles",
        "Everything in Pro",
        "Team collaboration",
        "White-label options",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      variant: "hero-outline" as const,
    },
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-16">
          <p className="text-small font-sans uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Pricing
          </p>
          <h2 className="font-serif text-heading md:text-display-sm text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative p-8 border ${
                plan.popular 
                  ? 'border-foreground border-2' 
                  : 'border-border'
              } bg-background`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs uppercase tracking-wider px-4 py-1">
                  Most Popular
                </span>
              )}
              
              <div className="mb-8">
                <h3 className="font-serif text-subheading text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-serif text-display-sm text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-small text-muted-foreground">
                    /{plan.period}
                  </span>
                </div>
                <p className="text-small text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-4 w-4 mt-1 text-foreground flex-shrink-0" />
                    <span className="text-body text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant={plan.variant} size="lg" className="w-full">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
