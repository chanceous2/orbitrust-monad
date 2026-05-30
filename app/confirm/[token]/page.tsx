import { redirect } from "next/navigation";

export default function ConfirmRedirectPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/review/${params.token}`);
}
