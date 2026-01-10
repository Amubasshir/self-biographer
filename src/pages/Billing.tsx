import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  profileLimit: number;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 biography profile',
      'Basic bio generation',
      'JSON-LD schema',
      'Public profile page',
    ],
    profileLimit: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    period: 'per month',
    description: 'For professionals and creators',
    features: [
      '10 biography profiles',
      'All bio types & tones',
      'Press kit builder',
      'Custom vanity URLs',
      'Priority AI generation',
      'Advanced analytics',
    ],
    profileLimit: 10,
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 79,
    period: 'per month',
    description: 'For teams and agencies',
    features: [
      'Unlimited profiles',
      'White-label branding',
      'Team collaboration',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    profileLimit: 999,
  },
];

const Billing = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const { data } = await supabase
        .from('billing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setBillingHistory(data || []);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);

    try {
      // Call edge function to create PayPal checkout session
      const response = await supabase.functions.invoke('create-checkout', {
        body: { planId },
      });

      if (response.error) throw response.error;

      // Redirect to PayPal checkout
      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        // For demo, just update the plan locally
        toast({
          title: 'Demo Mode',
          description: 'Payment integration is not configured. Plan would be updated upon payment.',
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = PLANS.find((p) => p.id === profile?.subscription_plan) || PLANS[0];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading font-serif mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-small text-muted-foreground mb-1">Current Plan</p>
            <h2 className="text-subheading font-serif">{currentPlan.name}</h2>
            <p className="text-muted-foreground mt-1">
              {profile?.profile_count || 0} of {profile?.profile_limit || 1} profiles used
            </p>
          </div>
          <div className="text-right">
            <p className="text-display-sm font-serif">
              ${currentPlan.price}
              <span className="text-small text-muted-foreground">/{currentPlan.period}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mb-12">
        <h2 className="text-subheading font-serif mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 relative ${
                plan.popular ? 'border-foreground' : 'border-border'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="text-subheading font-serif mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-small mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-display-sm font-serif">${plan.price}</span>
                <span className="text-muted-foreground text-small">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-small">
                    <Check className="h-4 w-4 text-foreground mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.id === profile?.subscription_plan ? 'outline' : 'hero'}
                className="w-full"
                disabled={plan.id === profile?.subscription_plan || !!loading}
                onClick={() => handleUpgrade(plan.id)}
              >
                {loading === plan.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : plan.id === profile?.subscription_plan ? (
                  'Current Plan'
                ) : (
                  <>
                    Upgrade <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h2 className="text-subheading font-serif mb-6">Billing History</h2>
        {billingHistory.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No billing history yet</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-small font-medium">Date</th>
                  <th className="text-left p-4 text-small font-medium">Description</th>
                  <th className="text-left p-4 text-small font-medium">Amount</th>
                  <th className="text-left p-4 text-small font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-4 text-small">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-small">{item.description}</td>
                    <td className="p-4 text-small">
                      ${item.amount} {item.currency}
                    </td>
                    <td className="p-4 text-small capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
