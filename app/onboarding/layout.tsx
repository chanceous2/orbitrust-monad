export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-onboarding-shell className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
