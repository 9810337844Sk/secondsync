import { useState } from "react";
import { Loader2, ScanSearch, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { detectDamage, type DamageResult } from "@/lib/damage-detection";

type Props = {
  imageFile: File;
  onConditionSuggested?: (condition: string) => void;
};

const LEVEL_CONFIG = {
  None:     { color: "bg-green-100 border-green-300 text-green-800",  bar: "bg-green-500",  icon: <CheckCircle2 className="h-4 w-4" /> },
  Minor:    { color: "bg-yellow-50 border-yellow-300 text-yellow-800", bar: "bg-yellow-400", icon: <AlertTriangle className="h-4 w-4" /> },
  Moderate: { color: "bg-orange-50 border-orange-300 text-orange-800", bar: "bg-orange-500", icon: <AlertTriangle className="h-4 w-4" /> },
  Severe:   { color: "bg-red-50 border-red-300 text-red-800",          bar: "bg-red-500",    icon: <AlertTriangle className="h-4 w-4" /> },
};

export function DamageAnalyzer({ imageFile, onConditionSuggested }: Props) {
  const [result, setResult]   = useState<DamageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [expanded, setExpanded] = useState(true);

  async function analyse() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await detectDamage(imageFile);
      setResult(res);
      if (onConditionSuggested) onConditionSuggested(res.suggestedCondition);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!result && !loading && !error) {
    return (
      <button type="button" onClick={analyse}
        className="flex items-center gap-2 rounded-full border border-crimson/30 bg-crimson/5 px-4 py-2 text-xs font-semibold text-crimson transition-all hover:bg-crimson/10 hover:scale-105">
        <Zap className="h-3.5 w-3.5" />
        AI Damage Check
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-crimson" />
        Analysing image for damage…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
        <span>{error}</span>
        <button onClick={analyse} className="ml-3 text-xs underline">Retry</button>
      </div>
    );
  }

  if (!result) return null;

  const cfg = LEVEL_CONFIG[result.level];

  return (
    <div className={`rounded-2xl border p-4 ${cfg.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4" />
          <span className="text-sm font-bold">AI Damage Analysis</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
            {result.level}
          </span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="opacity-60 hover:opacity-100">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Damage score bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Damage score</span>
          <span className="font-bold">{result.score}/100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${result.score}%` }} />
        </div>
      </div>

      {expanded && (
        <>
          {/* Summary */}
          <p className="mt-3 text-sm">{result.summary}</p>

          {/* Details */}
          {result.details.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="mt-0.5 flex-shrink-0">•</span> {d}
                </li>
              ))}
            </ul>
          )}

          {/* Suggested condition + price impact */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-black/5 px-3 py-2">
              <p className="font-semibold">Suggested Condition</p>
              <p className="mt-0.5 font-bold">{result.suggestedCondition}</p>
            </div>
            <div className="rounded-xl bg-black/5 px-3 py-2">
              <p className="font-semibold">Price Impact</p>
              <p className="mt-0.5 font-bold">{result.priceImpact}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs opacity-60">
            <span>Confidence: {result.confidence}</span>
            <button onClick={analyse} className="underline">Re-analyse</button>
          </div>

          {/* Apply suggestion */}
          {onConditionSuggested && (
            <button type="button" onClick={() => onConditionSuggested(result.suggestedCondition)}
              className="mt-3 w-full rounded-full bg-black/10 py-2 text-xs font-semibold hover:bg-black/20 transition-colors">
              Apply suggested condition: "{result.suggestedCondition}"
            </button>
          )}
        </>
      )}
    </div>
  );
}
