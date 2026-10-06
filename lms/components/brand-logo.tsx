import Image from "next/image";

export function BrandLogo() {
  return (
    <div className="brand-logo">
      <Image src="/brand/weareailabs-logo.png" alt="WeAreAiLabs" width={196} height={112} priority />
    </div>
  );
}
