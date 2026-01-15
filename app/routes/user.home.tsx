import { redirect, type LoaderFunctionArgs } from "react-router";
import { authorizeRequest } from "~/utilities/router.utilty";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await authorizeRequest(request, "GET");
  if (!session.user.verified) {
    return redirect("/user/onboarding");
  }
}

export default function Page() {
  return <></>;
}
