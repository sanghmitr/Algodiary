import { useEffect, useRef, useState } from "react";

interface LandingDocument {
  body: string;
  styles: string;
}

function extractLandingDocument(source: string): LandingDocument {
  const document = new DOMParser().parseFromString(source, "text/html");
  document.querySelectorAll("script").forEach((script) => script.remove());
  const styles = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n");

  return {
    body: document.body.innerHTML,
    styles,
  };
}

export function Landing() {
  const [landingDocument, setLandingDocument] = useState<LandingDocument | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/algodiary-landing.html")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Landing page could not be loaded");
        }
        return response.text();
      })
      .then((html) => {
        if (!cancelled) {
          setLandingDocument(extractLandingDocument(html));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLandingDocument({ body: "", styles: "" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!landingDocument || !hostRef.current) return undefined;

    const reveals = Array.from(hostRef.current.querySelectorAll<HTMLElement>(".reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    reveals.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [landingDocument]);

  if (!landingDocument) {
    return <main className="min-h-screen bg-[#f8f7f4]" />;
  }

  return (
    <>
      <style>{landingDocument.styles}</style>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: landingDocument.body }} />
    </>
  );
}
