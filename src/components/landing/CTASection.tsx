import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="section-padding bg-foreground">
      <div className="container-narrow text-center">
        <h2 className="font-serif text-heading md:text-display-sm text-background mb-6">
          Ready to Tell Your Story?
        </h2>
        
        <p className="text-body-lg text-background/70 max-w-xl mx-auto mb-10">
          Join thousands of professionals who trust SelfBiographer 
          to create their public presence.
        </p>
        
        <Button 
          size="xl"
          className="bg-background text-foreground hover:bg-background/90 border-0"
        >
          Create Your Biography
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
