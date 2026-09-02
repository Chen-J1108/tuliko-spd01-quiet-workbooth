import GhostFibers from "./GhostFibers";

type SiteFibersProps = {
  paused?: boolean;
  className?: string;
};

export function SiteFibers({ paused = false, className = "" }: SiteFibersProps) {
  return (
    <div className={`site-fibers-layer ${className}`.trim()} aria-hidden="true">
      <GhostFibers
        lineColor="#bccbbb"
        glowColor="#667a69"
        speed={0.15}
        scale={1.75}
        rotation={-22}
        rotationSpeed={0.035}
        layers={2}
        waveAmplitude={0.012}
        waveFrequency={1.8}
        waveSpeed={-0.22}
        layerSpeed={0.05}
        twist={0.08}
        twistFrequency={2.6}
        twistSpeed={0.22}
        lineFrequency={4}
        lineSpacing={1.7}
        lineSharpness={9}
        glowFalloff={12}
        glowIntensity={0.7}
        brightness={1.05}
        blueBoost={0.93}
        vignette={0.65}
        grain={0.015}
        dpr={0.65}
        fps={30}
        paused={paused}
      />
    </div>
  );
}

