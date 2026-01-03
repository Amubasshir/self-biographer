import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="section-padding min-h-[85vh] flex items-center justify-center">
      <div className="container-wide text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-small font-sans uppercase tracking-[0.2em] text-muted-foreground mb-6 fade-in-up opacity-0">
            Professional Biography Platform
          </p>
          
          <h1 className="font-serif text-display-sm md:text-display text-foreground mb-8 fade-in-up opacity-0 stagger-1">
            Your Story,<br />
            Professionally Told.
          </h1>
          
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 fade-in-up opacity-0 stagger-2">
            Create publication-ready biographies, press kits, and structured data 
            in minutes. Powered by AI, designed for professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up opacity-0 stagger-3">
            <Button variant="hero" size="xl">
              Start Your Biography
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="hero-outline" size="xl">
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
