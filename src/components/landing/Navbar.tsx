// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/contexts/AuthContext";
// import { useNavigate } from "react-router-dom";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const {user} = useAuth();
//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
//       <div className="container-wide px-6 md:px-12 lg:px-24">
//         <div className="flex items-center justify-between h-16 md:h-18">
//           <a href="/" className="font-serif text-xl text-foreground">
//             SelfBiographer
//           </a>
          
//           <div className="hidden md:flex items-center gap-8">
//             <a href="#features" className="text-small text-muted-foreground hover:text-foreground transition-colors">
//               Features
//             </a>
//             <a href="#pricing" className="text-small text-muted-foreground hover:text-foreground transition-colors">
//               Pricing
//             </a>
//             <a href="#" className="text-small text-muted-foreground hover:text-foreground transition-colors">
//               Examples
//             </a>
//           </div>
          
//           <div className="flex items-center gap-4">
//             {!profile?.email ? <>
//             <Button onClick={() => navigate('/auth')} className="hidden sm:inline-block text-small text-foreground hover:text-muted-foreground bg-transparent hover:bg-transparent transition-colors">
//               Sign In
//             </Button>
//             <Button variant="hero" size="sm">
//               Get Started
//             </Button>
//             </> 
//             :
//             // add a profile icon with dropdown in future

//             }
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;


import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth(); // adjust logout name if needed

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-wide px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <a href="/" className="font-serif text-xl text-foreground">
            SelfBiographer
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-small text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-small text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#" className="text-small text-muted-foreground hover:text-foreground transition-colors">
              Examples
            </a>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {!profile ? (
              <>
                <Button
                  onClick={() => navigate("/auth")}
                  className="hidden sm:inline-block text-small bg-transparent hover:bg-transparent"
                >
                  Sign In
                </Button>
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {profile?.subscription_plan} plan
                    </p>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={signOut}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
