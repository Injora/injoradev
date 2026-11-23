/** Static stand-in for devices without WebGL (or with Save-Data on): soft light shafts over the body's water gradient. */
export function SceneFallback() {
  return (
    <div className="absolute inset-0 bg-[repeating-linear-gradient(105deg,rgb(111_240_216/0.035)_0_40px,transparent_40px_140px)] [mask-image:linear-gradient(180deg,#000,transparent_70%)]" />
  );
}
