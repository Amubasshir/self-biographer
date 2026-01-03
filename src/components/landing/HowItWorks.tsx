const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Enter Your Details",
      description: "Fill in your professional information—career highlights, education, achievements, and social links through our guided form.",
    },
    {
      number: "02",
      title: "Generate & Refine",
      description: "Our AI creates multiple biography versions. Edit, regenerate, or fine-tune until it perfectly captures your story.",
    },
    {
      number: "03",
      title: "Publish & Share",
      description: "Get a hosted profile page, downloadable press kit, and SEO-optimized structured data—all ready to share.",
    },
  ];

  return (
    <section className="section-padding bg-secondary">
      <div className="container-narrow">
        <div className="text-center mb-16">
          <p className="text-small font-sans uppercase tracking-[0.2em] text-muted-foreground mb-4">
            How It Works
          </p>
          <h2 className="font-serif text-heading md:text-display-sm text-foreground">
            Three Simple Steps
          </h2>
        </div>
        
        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <span className="font-serif text-6xl md:text-7xl text-foreground/10 absolute -top-4 -left-2">
                {step.number}
              </span>
              
              <div className="pt-12">
                <h3 className="font-serif text-subheading text-foreground mb-4">
                  {step.title}
                </h3>
                
                <p className="text-body text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-px h-12 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
