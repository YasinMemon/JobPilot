import { cn } from "@/lib/utils";

export type StepIndicatorStep = {
  key: string;
  label: string;
  description?: string;
};

type StepIndicatorProps = {
  steps: StepIndicatorStep[];
  currentStep: number;
};

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3" aria-label="Registration progress">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-3 last:flex-none">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                    isComplete && "border-indigo-500 bg-indigo-600 text-white",
                    isActive && "border-indigo-400 bg-white/5 text-indigo-200",
                    !isActive && !isComplete && "border-white/10 bg-white/5 text-slate-500"
                  )}
                >
                  {index + 1}
                </div>

                <div className="hidden sm:block">
                  <p className={cn("text-sm font-medium", isActive || isComplete ? "text-white" : "text-slate-400")}>
                    {step.label}
                  </p>
                  {step.description ? <p className="text-xs text-slate-400">{step.description}</p> : null}
                </div>
              </div>

              {index < steps.length - 1 ? (
                <div className={cn("h-px flex-1", isComplete ? "bg-indigo-500/60" : "bg-white/10")} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="sm:hidden">
        <p className="text-sm font-medium text-white">{steps[currentStep]?.label}</p>
        {steps[currentStep]?.description ? <p className="text-xs text-slate-400">{steps[currentStep].description}</p> : null}
      </div>
    </div>
  );
}