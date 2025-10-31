import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationsManager() {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Integrations</h2>
      <p className="text-muted-foreground text-sm">
        Connect third-party tools like analytics, newsletters, or automation here.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button variant="secondary">Connect Google Analytics</Button>
        <Button variant="secondary">Connect Mailchimp</Button>
        <Button variant="secondary">Connect Zapier</Button>
      </div>
    </Card>
  );
}
