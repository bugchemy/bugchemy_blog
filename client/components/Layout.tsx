import { ReactNode, useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2", className)}
      aria-label="Bugchemy Home"
    >
      <img
        src="/web-app-manifest-192x192.png"
        alt="Bugchemy"
        className="h-7 w-7"
        loading="eager"
      />
      <span className="font-semibold tracking-tight">Bugchemy</span>
    </Link>
  );
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <Button
      onClick={toggle}
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
    >
      {dark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
        >
          <path d="M21.64 13a9 9 0 01-10.63-10.63A9 9 0 1021.64 13z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
        >
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
          <path d="M12 2v2m0 16v2m8-10h2M2 12H0m16.95 6.95l1.41 1.41M5.64 5.64L4.22 4.22m12.73 0l1.41 1.41M5.64 18.36l-1.41 1.41" />
        </svg>
      )}
    </Button>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null); // Store profile data
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch authenticated user and profile
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setProfile(null);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile({ ...user, display_name: user.email, avatar_url: "/favicon-96x96.png" });
      } else {
        setProfile(profileData);
      }
    };

    fetchProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return setProfile(null);

      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) console.error("Error fetching profile:", error);
          else setProfile(data);
        });
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate("/auth");
  };

  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/20",
        location.pathname === to ? "text-primary" : "text-foreground/80"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {link("/blog", "Blog")}
            {profile?.is_admin && link("/admin", "Admin")}
          </nav>
        </div>
        <div className="flex items-center gap-2 relative">
          <ThemeToggle />

          {!profile ? (
            <Link
              to="/auth"
              className="hidden sm:block text-sm text-muted-foreground hover:text-primary"
            >
              Login
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 text-sm text-foreground/90 hover:text-primary focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <img
                  src={profile.avatar_url || "/web-app-manifest-192x192.png"}
                  alt={profile.display_name || profile.email}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span>{profile.display_name || profile.email}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-background border rounded-md shadow-md py-2 z-50">
                  <Link
                    to="/blog"
                    className="block px-4 py-2 text-sm hover:bg-accent/20"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Blog
                  </Link>

                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-accent/20"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>

                  {profile.is_admin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm hover:bg-accent/20"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent/20"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10 mt-20">
      <div className="container grid gap-6 md:grid-cols-2 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img src="/favicon-96x96.png" alt="Bugchemy" className="h-5 w-5" />
          <span>
            © {new Date().getFullYear()} Bugchemy. Experiment. Learn. Evolve.
          </span>
        </div>
        <div className="flex gap-4 justify-start md:justify-end">
          <a
            className="text-sm text-muted-foreground hover:text-primary"
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
          >
            X
          </a>
          <a
            className="text-sm text-muted-foreground hover:text-primary"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="text-sm text-muted-foreground hover:text-primary"
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let w = (cvs.width = Math.floor(window.innerWidth * DPR));
    let h = (cvs.height = Math.floor(window.innerHeight * DPR));
    cvs.style.width = `${window.innerWidth}px`;
    cvs.style.height = `${window.innerHeight}px`;

    const styles = getComputedStyle(document.documentElement);
    const parseHsl = (str: string) => {
      const parts = str.split(" ").map((v) => parseFloat(v));
      return { h: parts[0] || 0, s: parts[1] || 0, l: parts[2] || 0 };
    };
    const hsla = (h: number, s: number, l: number, a: number) =>
      `hsl(${h} ${s}% ${l}% / ${a})`;
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));
    const shiftColor = (
      base: { h: number; s: number; l: number },
      shift = 0,
      sMul = 1,
      lMul = 1,
      a = 0.08
    ) => {
      const h2 = (base.h + shift + 360) % 360;
      const s2 = clamp(base.s * sMul, 0, 100);
      const l2 = clamp(base.l * lMul, 0, 100);
      return hsla(h2, s2, l2, a);
    };

    const accent = parseHsl(styles.getPropertyValue("--accent").trim());
    const primary = parseHsl(styles.getPropertyValue("--primary").trim());

    type BlobSpec = {
      r: number;
      color: string;
      amp: number;
      speed: number;
      phase: number;
    };

    const specs: BlobSpec[] = [
      {
        r: 560,
        color: shiftColor(primary, 8, 1.0, 1.0, 0.045),
        amp: 180,
        speed: 0.025,
        phase: 0.3,
      },
      {
        r: 500,
        color: shiftColor(primary, -18, 0.95, 1.05, 0.05),
        amp: 160,
        speed: 0.03,
        phase: 1.1,
      },
      {
        r: 420,
        color: shiftColor(accent, 12, 1.0, 1.0, 0.06),
        amp: 140,
        speed: 0.04,
        phase: 2.0,
      },
      {
        r: 380,
        color: shiftColor(accent, -10, 0.95, 1.05, 0.065),
        amp: 130,
        speed: 0.045,
        phase: 2.8,
      },
      {
        r: 320,
        color: shiftColor(accent, 0, 1.0, 1.0, 0.08),
        amp: 120,
        speed: 0.055,
        phase: 3.6,
      },
    ];

    const pointer = { x: w / 2, y: h / 2 };
    const smooth = { x: w / 2, y: h / 2 };

    let mvQueued = false;
    const onMove = (e: MouseEvent) => {
      const rx = e.clientX / window.innerWidth;
      const ry = e.clientY / window.innerHeight;
      pointer.x = rx * w;
      pointer.y = ry * h;
      if (!mvQueued) {
        mvQueued = true;
        requestAnimationFrame(() => {
          mvQueued = false;
          if (gridRef.current) {
            const amp = 6;
            const px = (rx - 0.5) * amp;
            const py = (ry - 0.5) * amp;
            gridRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
          }
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onResize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cvs.width = Math.floor(window.innerWidth * dpr);
      h = cvs.height = Math.floor(window.innerHeight * dpr);
      cvs.style.width = `${window.innerWidth}px`;
      cvs.style.height = `${window.innerHeight}px`;
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let running = true;

    const draw = (t: number) => {
      smooth.x += (pointer.x - smooth.x) * 0.08;
      smooth.y += (pointer.y - smooth.y) * 0.08;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < specs.length; i++) {
        const s = specs[i];
        const ox = Math.cos(t * s.speed + s.phase) * s.amp * DPR;
        const oy = Math.sin(t * s.speed + s.phase) * s.amp * DPR;
        const x = smooth.x + ox;
        const y = smooth.y + oy;

        const radius = s.r * DPR;
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, s.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g as any;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (ts: number) => {
      if (!running) return;
      draw(ts * 0.001);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!prefersReduced) {
      raf = requestAnimationFrame(loop);
    } else {
      draw(0);
    }

    return () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div
        ref={gridRef}
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground)/0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)/0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth")|| location.pathname.startsWith("/cs");

  // Apply dark theme by default for Auth and CS pages
// Apply dark theme visually for Auth and CS pages without overwriting user preference
  useEffect(() => {
    if (isAuthPage) {
      document.documentElement.classList.add("dark");
    } else {
      // restore based on stored preference or system
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = stored ? stored === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isAuthPage]);
  return (
    <div className="min-h-screen flex flex-col">
      <InteractiveBackground />
      {!isAuthPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
