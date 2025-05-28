import { Button } from "@/components/ui/button";
import Link from "next/link";
import { landingContent } from "@/lib/landing-content";

export default function Home() {
  const { hero, features, newFeatures } = landingContent;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container flex min-h-[60vh] flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8 text-center">
            <h1 className="text-5xl font-bold tracking-tight">{hero.title}</h1>
            <p className="text-xl text-muted-foreground">
              {hero.description}
            </p>
            <div className="flex flex-col space-y-4 pt-8">
              <Link href="/login" passHref>
                <Button className="w-full" size="lg">
                  {hero.buttonText}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">{features.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.items.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Features Highlight */}
        <div className="container py-16 bg-muted/30">
          <h2 className="text-3xl font-bold text-center mb-12">{newFeatures.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {newFeatures.items.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`h-12 w-12 rounded-full ${feature.iconBgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
