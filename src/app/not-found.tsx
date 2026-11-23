import { AppHeader, PageTitle, Screen } from "@/components/layout/screen";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Screen header={<AppHeader />}>
      <PageTitle title="Page not found">That screen doesn&apos;t exist.</PageTitle>
      <ButtonLink href="/">Go to Home</ButtonLink>
    </Screen>
  );
}
