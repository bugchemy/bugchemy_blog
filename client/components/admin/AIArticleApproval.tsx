import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AIJob } from "@/lib/content";
import Markdown from "@/components/Markdown";
import { Check, X, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

interface AIArticleApprovalProps {
  aiJobs: AIJob[];
  onApprove: (jobId: string, customSlug?: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AIArticleApproval({
  aiJobs,
  onApprove,
  onReject,
  onDelete,
}: AIArticleApprovalProps) {
  const [customSlugs, setCustomSlugs] = useState<Record<string, string>>({});

  const getSlug = (jobId: string, suggestedSlug: string) => {
    return customSlugs[jobId] || suggestedSlug;
  };

  const pendingJobs = aiJobs.filter((j) => j.status === "pending");
  const approvedJobs = aiJobs.filter((j) => j.status === "approved");
  const rejectedJobs = aiJobs.filter((j) => j.status === "rejected");

  const renderJobCard = (job: AIJob) => (
    <Card key={job.id} className="p-3 sm:p-4">
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm sm:text-base line-clamp-2">{job.title}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{job.excerpt}</p>
          <div className="flex gap-1 flex-wrap mt-2">
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{job.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Author: {job.author}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full text-xs">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogTitle>Article Preview</DialogTitle>
            <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm">
              <Markdown content={job.content} />
            </div>
          </DialogContent>
        </Dialog>

        {job.status === "pending" && (
          <div className="border-t pt-4">
            <div className="mb-3">
              <Label htmlFor={`slug-${job.id}`} className="text-xs">
                URL Slug (suggested: {job.suggestedSlug})
              </Label>
              <Input
                id={`slug-${job.id}`}
                value={customSlugs[job.id] || ""}
                onChange={(e) =>
                  setCustomSlugs({ ...customSlugs, [job.id]: e.target.value })
                }
                placeholder={job.suggestedSlug}
                className="text-xs sm:text-sm mt-1"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => onApprove(job.id, customSlugs[job.id])}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-xs"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(job.id)}
                className="flex-1 sm:flex-none text-xs"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {job.status === "approved" && (
          <div className="border-t pt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-green-600 text-xs">Approved</Badge>
              <span className="text-xs text-muted-foreground">
                by {job.approvedBy}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(job.id)}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        )}

        {job.status === "rejected" && (
          <div className="border-t pt-4 flex items-center justify-between gap-2">
            <Badge variant="destructive" className="text-xs">Rejected</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(job.id)}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="grid gap-6 sm:gap-8">
      {/* Pending Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          Pending Approval ({pendingJobs.length})
        </h3>
        {pendingJobs.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
            No pending articles to approve.
          </p>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {pendingJobs.map((job) => renderJobCard(job))}
          </div>
        )}
      </div>

      {/* Approved Section */}
      {approvedJobs.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Approved ({approvedJobs.length})
          </h3>
          <div className="grid gap-3 sm:gap-4">
            {approvedJobs.map((job) => renderJobCard(job))}
          </div>
        </div>
      )}

      {/* Rejected Section */}
      {rejectedJobs.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Rejected ({rejectedJobs.length})
          </h3>
          <div className="grid gap-3 sm:gap-4">
            {rejectedJobs.map((job) => renderJobCard(job))}
          </div>
        </div>
      )}
    </div>
  );
}
