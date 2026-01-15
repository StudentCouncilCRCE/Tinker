import {
  data,
  Link,
  redirect,
  useFetcher,
  useLocation,
  useNavigate,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Github } from "lucide-react";
import type { ApiResponse } from "~/utilities/types/api.types";
import {
  catchError,
  catchTypedError,
} from "~/utilities/handlers/error.handlers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { permissionLevel } from "~/data/const/auth.k";
import { authorizeRequest, requireHttpMethod } from "~/utilities/router.utilty";
import { ValidationError } from "~/utilities/errors/validation.errors";
import { z } from "zod";
import { signinAction, signupAction } from "./action";
import { appLogger } from "~/lib/logger.server";

const homePage = "/user/home";

export async function loader({ request }: LoaderFunctionArgs) {
  return await catchTypedError(
    authorizeRequest(request, "GET", permissionLevel.USER),
    [ValidationError]
  ).then(([error, session]) => {
    if (session) return redirect(homePage);
  });
}

export async function action({ request }: ActionFunctionArgs) {
  requireHttpMethod(request, "POST");

  try {
    const formData = await request.formData();

    const authSchema = z.object({
      email: z.email("Enter a valid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
      confirmPassword: z.string().default("Error in confirm password"),
      intent: z.enum(["signin", "signup"]),
    });
    const submission = authSchema.safeParse(Object.fromEntries(formData));

    if (!submission.success) {
      return data(
        { success: false, error: { message: submission.error.message } },
        { status: 400 }
      );
    }

    appLogger.info(
      {
        email: submission.data.email,
        intent: submission.data.intent,
      },
      "Authentication attempt"
    );

    if (submission.data.intent === "signin")
      return signinAction(
        submission.data.email,
        submission.data.password,
        homePage,
        true,
        request
      );
    else if (submission.data.intent === "signup")
      return signupAction(
        "Random Spacial",
        submission.data.email,
        submission.data.password,
        submission.data.confirmPassword,
        permissionLevel.USER,
        homePage,
        true,
        request
      );
  } catch (error) {
    appLogger.error(error, "Failed attempt to authenticate");
    return data<ApiResponse>(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 400 }
    );
  }
}

export default function AuthenticationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignIn, setSignIn] = useState<boolean>(
    searchParams.get("view") !== "signup"
  );
  useEffect(() => {
    setSearchParams({ view: isSignIn ? "signin" : "signup" });
  }, [isSignIn]);

  useEffect(() => {
    if (!fetcher.data) return;

    const data = fetcher.data as ApiResponse;
    if (data.success) {
      toast.success(data.message);
      isSignIn && navigate(data.data.url);
    } else if (!data.success)
      Array.isArray(data.error.message)
        ? data.error.message.forEach((msg) => toast.error(msg))
        : toast.error(data.error.message);
  }, [fetcher.data]);

  return (
    <div className="transition-all bg-muted flex min-h-dvh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <fetcher.Form
                action={location.pathname}
                method="post"
                className="p-6 md:p-8"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      {isSignIn ? "Welcome back" : "Create an account"}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {isSignIn
                        ? "Login to your account"
                        : "It only takes a minute"}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="me@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      {isSignIn && (
                        <Link
                          to="/auth/forgot-password"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      )}
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="password"
                      required
                    />
                  </div>
                  {!isSignIn && (
                    <div className="grid gap-3">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        placeholder="password"
                        type="password"
                        required
                      />
                    </div>
                  )}
                  <input
                    id="intent"
                    name="intent"
                    value={isSignIn ? "signin" : "signup"}
                    type="hidden"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={fetcher.state === "submitting"}
                  >
                    {fetcher.state === "submitting"
                      ? "Loading..."
                      : isSignIn
                        ? "Login"
                        : "Create"}
                  </Button>

                  <div className="text-center text-sm">
                    {isSignIn ? "Don't" : "Already"} have an account?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="underline underline-offset-4 px-1 text-sm"
                      onClick={() => setSignIn(!isSignIn)}
                    >
                      Sign {isSignIn ? "up" : "in"}
                    </Button>
                  </div>
                </div>
              </fetcher.Form>
              <div className="bg-muted relative hidden md:block">
                <img
                  src="/assets/images/banners/whispers_of_the_fern.webp"
                  alt="Poster Image"
                  className="absolute inset-0 h-full w-full object-cover bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
