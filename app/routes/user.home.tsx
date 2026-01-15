import {
  data,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { postgresDB } from "~/database";
import { usersTable } from "~/database/pg.schema";
import {
  matchesTable,
  userProfileTable,
} from "~/database/pg.schema/tinker.schema";
import { authorizeRequest } from "~/utilities/router.utilty";
import { eq, and, ne, sql, like } from "drizzle-orm";
import { appLogger } from "~/lib/logger.server";
import { TinderStack } from "~/components/layout/tinder-stack";
import { type ApiResponse } from "~/utilities/types/api.types";
import type { PublicProfile } from "~/utilities/types/profile.type";
import { axiosClient } from "~/lib/axios.client";
import { sendEmail } from "~/lib/mailer.server";
import { emailTemplates } from "~/utilities/mail/templates";
import { alias } from "drizzle-orm/pg-core";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await authorizeRequest(request, "GET");
  if (!session.user.verified) {
    return redirect("/user/onboarding");
  }

  const profiles = await postgresDB
    .select({
      id: userProfileTable.id,
      name: usersTable.name,
      bio: userProfileTable.bio,
      image: usersTable.image,
    })
    .from(usersTable)
    .leftJoin(userProfileTable, eq(usersTable.id, userProfileTable.userId))
    .where(ne(usersTable.id, session.user.id));

  appLogger.info(profiles, "User Home Data Fetched");

  return data<ApiResponse>({
    success: true,
    data: profiles,
    message: "User profiles fetched successfully",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await authorizeRequest(request, "POST");

  const formData = await request.formData();
  const swipedUserId = formData.get("swipedUserId") as string;
  const direction = formData.get("direction") as "left" | "right";
  if (direction === "left") {
    return data<ApiResponse>({
      success: true,
      message: "User swiped left",
    });
  }

  appLogger.info(
    { swipedUserId, direction, userId: session.user.id },
    "User Swipe Action"
  );

  const isMatch = await postgresDB
    .select()
    .from(matchesTable)
    .innerJoin(
      alias(userProfileTable, "likedBy"),
      eq(matchesTable.likeBy, swipedUserId)
    )
    .innerJoin(
      alias(userProfileTable, "likedUser"),
      eq(matchesTable.likeUser, swipedUserId)
    )
    .limit(1)
    .then((res) => (res.length > 0 ? res[0] : undefined));

  if (isMatch) {
    const likeByUser = await postgresDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, isMatch.matches.likeBy))
      .limit(1)
      .then((res) => res[0]);

    await postgresDB
      .update(matchesTable)
      .set({ mailSent: true })
      .where(eq(matchesTable.id, isMatch.matches.id))
      .returning();

    const matchnotificationEmailTemplate =
      emailTemplates.matchNotificationEmail;

    sendEmail({
      to: session.user.email,
      subject: matchnotificationEmailTemplate.subject,
      text: matchnotificationEmailTemplate.text(
        likeByUser.name,
        isMatch.likedBy.instagramUsername
      ),
      html: matchnotificationEmailTemplate.html(
        likeByUser.name,
        isMatch.likedBy.instagramUsername
      ),
    });

    sendEmail({
      to: likeByUser.email,
      subject: matchnotificationEmailTemplate.subject,
      text: matchnotificationEmailTemplate.text(
        session.user.name,
        isMatch.likedUser.instagramUsername
      ),
      html: matchnotificationEmailTemplate.html(
        session.user.name,
        isMatch.likedUser.instagramUsername
      ),
    });

    return data<ApiResponse>({
      success: true,
      message: "It's a match! Check your mail.",
    });
  } else {
    await postgresDB
      .insert(matchesTable)
      .values({
        likeBy: session.user.id,
        likeUser: swipedUserId,
      })
      .returning();

    return data<ApiResponse>({
      success: true,
      message: "",
    });
  }
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  const profiles: PublicProfile[] = loaderData.success ? loaderData.data : [];

  const handleSwipe = (direction: "left" | "right", user: PublicProfile) => {
    if (direction === "right") {
      axiosClient.post("/user/home", {
        swipedUserId: user.id,
        direction,
      });
    }
  };

  return (
    <>
      {profiles.length === 0 ? (
        <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center px-6">
          <div className="mb-4 text-4xl">😕</div>

          <h2 className="text-xl font-semibold mb-2">
            No profiles to show right now
          </h2>

          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            You've seen everyone nearby or there are no new profiles available
            at the moment.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            For more updates check your email notifications.
          </p>

          <div className="flex gap-3">
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>

            <a
              href="/user/settings"
              className="rounded-md border px-4 py-2 text-sm"
            >
              Update preferences
            </a>
          </div>
        </div>
      ) : (
        <TinderStack
          users={profiles}
          onRightSwipe={(user) => handleSwipe("right", user)}
          onLeftSwipe={(user) => handleSwipe("left", user)}
        />
      )}
    </>
  );
}
