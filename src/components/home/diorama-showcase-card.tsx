import Image from "next/image";

// A museum/boutique-display card for the photographed diorama. Unlike
// the illustrated hero mascot elsewhere on the site, this source image
// is a plain rectangular photograph with its own studio background
// already baked in — nothing to remove, nothing to crop. All the work
// here happens in the card AROUND the image: a warm stone surface
// (instead of the usual white card) so the photo's own warm tones
// don't sit inside a colder frame, a soft inner vignette that lets the
// photo's edges dissolve into that surface, and a contact shadow placed
// just below the image so the diorama's stone platform reads as
// resting on the card rather than the photo looking pasted onto it.
//
// Drop the source photo at public/products/diorama.png (adjust the src
// below if you place it elsewhere) — width/height match the file's
// actual pixel dimensions (1535x1024) so next/image can reserve the
// right aspect ratio without ever cropping or stretching it.

export function DioramaShowcaseCard() {
  return (
    <div
      className="relative mx-auto w-full max-w-3xl rounded-[24px] p-6"
      style={{
        backgroundColor: "#E4D8C7",
        backgroundImage: "linear-gradient(180deg, #E8DCCB 0%, #D9CCBA 100%)",
        border: "1px solid rgba(80,60,40,0.08)",
        boxShadow:
          "0 8px 24px rgba(65,45,25,0.08), 0 20px 60px rgba(65,45,25,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
      }}
    >
      {/* No frame, no border, no background color on this wrapper —
          it exists only so next/image has a sized ancestor and so the
          vignette overlay below can be positioned against the photo's
          own edges. The photo is shown at its full, uncropped aspect
          ratio (1535:1024); width scales with the card, height follows
          automatically via h-auto. */}
      <div className="relative">
        <Image
          src="/products/diorama.png"
          alt="Diorama warga binaan Lapas Perempuan Kelas IIA Jakarta membuat dan menyiapkan produk batik dan kerajinan tangan"
          width={1535}
          height={1024}
          sizes="(min-width: 1024px) 48rem, 100vw"
          className="relative z-0 h-auto w-full rounded-[16px]"
          priority
        />

        {/* Edge vignette: an inset shadow (not an extra overlay element
            with its own edges/border) so the photo's own rectangular
            boundary softens into the card's warm surface instead of
            reading as a hard-edged sticker. Kept extremely faint —
            3-5% — per spec; this should be almost impossible to
            consciously notice, only felt as "the photo belongs here." */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[16px]"
          style={{
            boxShadow:
              "inset 0 0 2px rgba(65,45,25,0.03), inset 0 0 48px 8px rgba(217,204,186,0.05)",
          }}
        />
      </div>

      {/* Grounding shadow: sits in the card's own padding area just
          below the photo (not on top of it), straddling the seam
          between the two via a small negative margin. This is what
          keeps the diorama's stone platform from looking like it ends
          abruptly at the photo's bottom edge — the shadow reads as a
          continuation of the platform's own contact shadow onto the
          card surface beneath it, which is what actually sells
          "resting on the card" rather than "photo floating above it."
          Width is narrower than the card (not full-bleed) since the
          platform itself doesn't reach the card's outer edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative mx-auto -mt-6 h-12 w-[86%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 35%, transparent 70%)",
          filter: "blur(9px)",
        }}
      />
    </div>
  );
}
