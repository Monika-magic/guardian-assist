import { useEffect, useRef, useState } from "react";
import { Video, VideoOff } from "lucide-react";
import { startCamera, stopCamera } from "@/lib/media";

export function LiveCamera({ active }: { active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "live" | "denied">("idle");

  useEffect(() => {
    let mounted = true;
    if (active && ref.current) {
      startCamera(ref.current).then(ok => {
        if (!mounted) return;
        setStatus(ok ? "live" : "denied");
      });
    }
    return () => {
      mounted = false;
      stopCamera();
      setStatus("idle");
    };
  }, [active]);

  return (
    <div className="glass-card overflow-hidden rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-danger" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Live Video Stream
          </span>
        </div>
        <span className={`flex items-center gap-1 font-mono text-[10px] ${status === "live" ? "text-danger" : "text-muted-foreground"}`}>
          {status === "live" && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />}
          {status === "live" ? "● BROADCASTING" : status === "denied" ? "simulated" : "starting…"}
        </span>
      </div>

      <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-border bg-background/60">
        <video
          ref={ref}
          muted
          playsInline
          className={`h-full w-full object-cover ${status === "live" ? "" : "hidden"}`}
        />
        {status !== "live" && (
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, oklch(0.62 0.245 25 / 0.12) 0 1px, transparent 1px 4px)`,
              }}
            />
            <div className="relative flex flex-col items-center gap-2 text-center">
              <VideoOff className="h-7 w-7 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {status === "denied" ? "Camera unavailable — simulated feed" : "Connecting camera…"}
              </p>
            </div>
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
          REC · LIVE
        </div>
        <div className="absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
          → contacts
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Live video streaming to contacts via encrypted relay (simulated)
      </p>
    </div>
  );
}
