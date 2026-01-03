const TrustedBy = () => {
  const logos = [
    { name: "Forbes", text: "Forbes" },
    { name: "TechCrunch", text: "TechCrunch" },
    { name: "The Guardian", text: "The Guardian" },
    { name: "Bloomberg", text: "Bloomberg" },
    { name: "Fast Company", text: "Fast Company" },
  ];

  return (
    <section className="py-16 border-y border-border">
      <div className="container-wide px-6 md:px-12 lg:px-24">
        <p className="text-center text-small uppercase tracking-[0.15em] text-muted-foreground mb-10">
          Trusted by professionals featured in
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 md:gap-x-16">
          {logos.map((logo) => (
            <span 
              key={logo.name}
              className="text-xl md:text-2xl font-serif text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              {logo.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
