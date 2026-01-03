import { FileText, Code, Share2 } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: FileText,
      title: "AI-Powered Biographies",
      description: "Generate professional biographies in multiple formats—short, long, LinkedIn, speaker, and press-ready—tailored to your tone and audience.",
    },
    {
      icon: Code,
      title: "JSON-LD Schema",
      description: "Automatically generate structured data for search engines. Boost your visibility with validated Person and Organization schemas.",
    },
    {
      icon: Share2,
      title: "Press Kit Builder",
      description: "Create hosted press kits with your bios, images, and contact information. Share a single link with journalists and event organizers.",
    },
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-16">
          <p className="text-small font-sans uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Features
          </p>
          <h2 className="font-serif text-heading md:text-display-sm text-foreground">
            Everything You Need
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group p-8 border border-border hover:border-foreground transition-colors duration-300"
            >
              <feature.icon className="h-8 w-8 mb-6 text-foreground" strokeWidth={1.5} />
              
              <h3 className="font-serif text-subheading text-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-body text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
