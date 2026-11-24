interface ChristmasHouseSceneProps {
  className?: string;
}

export function ChristmasHouseScene({ className = '' }: ChristmasHouseSceneProps) {
  return (
    <div className={`relative overflow-hidden bg-[#14191F] ${className}`}>
      {/* Real CENTRO Architectural Residence Photo */}
      <img
        src="/assets/aistudio/image_fb8b8a7e.png"
        alt="แบบบ้านเดี่ยว CENTRO พระราม 2 - พุทธบูชา 2 สไตล์ Luxury Architectural Residence"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center"
      />

      {/* Seamless Obsidian Twilight Blend Gradient */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#14191F] via-[#14191F]/35 to-transparent pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#14191F]/70 via-transparent to-transparent pointer-events-none"
      />
    </div>
  );
}
