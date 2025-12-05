import { useEffect } from "react";

type AdUnitProps = {
  client?: string;
  slot?: string;
  style?: React.CSSProperties;
  format?: string;
};

export default function AdUnit({
  client = "ca-pub-3808533657187262",
  slot,
  style,
  format = "auto",
}: AdUnitProps) {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // ignore errors; ads lib may not be loaded in dev or blocked
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={style || { display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
