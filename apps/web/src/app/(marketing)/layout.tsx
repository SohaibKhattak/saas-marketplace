import { GlobalFooter } from "@/components/layout/global-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
      <GlobalFooter />
    </div>
  );
}
