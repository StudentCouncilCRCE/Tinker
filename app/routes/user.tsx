import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import { permissionLevel } from "~/data/const/auth.k";
import { ValidationError } from "~/utilities/errors/validation.errors";
import { catchTypedError } from "~/utilities/handlers/error.handlers";
import { authorizeRequest } from "~/utilities/router.utilty";
import { AppNavbar } from "~/components/layout/foundation/app-navbar";

export async function loader({ request }: LoaderFunctionArgs) {
  return await catchTypedError(
    authorizeRequest(request, "GET", permissionLevel.USER),
    [ValidationError]
  ).then(([error]) => {
    if (error) return redirect("/authenticate");
  });
}

export default function Page() {
  return (
    <>
      <AppNavbar />
      <Outlet />
    </>
  );
}
