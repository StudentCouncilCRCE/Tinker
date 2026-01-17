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
      id: userProfileTable.userId,
      name: userProfileTable.name,
      bio: userProfileTable.bio,
      image: userProfileTable.image,
    })
    .from(userProfileTable)
    .where(ne(userProfileTable.userId, session.user.id));

  const shuffledProfiles = profiles.sort(() => Math.random() - 0.5);

  appLogger.info(profiles, "User Home Data Fetched");

  return data<ApiResponse>({
    success: true,
    data: shuffledProfiles,
    message: "User profiles fetched successfully",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await authorizeRequest(request, "POST");

  const formJson = await request.json();
  const swipedUserId = formJson.swipedUserId as string;
  const direction = formJson.direction as "left" | "right";

  if (direction === "left") {
    return data<ApiResponse>({
      success: true,
      message: "User swiped left",
    });
  }

  appLogger.info(
    { swipedUserId, direction, userId: session.user.id },
    "User Swipe Action",
  );

  // Check if the swiped user has already liked the current user
  const existingMatch = await postgresDB
    .select()
    .from(matchesTable)
    .where(
      and(
        eq(matchesTable.likeFormUser, swipedUserId),
        eq(matchesTable.likeToUser, session.user.id),
      ),
    )
    .limit(1);

  appLogger.info(existingMatch, "Match Check Result");

  if (existingMatch.length > 0 && existingMatch[0].mailSent === false) {
    // It's a match!
    const matchRecord = existingMatch[0];

    // Get both user profiles
    const [swipedUserProfile, currentUserProfile] = await Promise.all([
      postgresDB
        .select()
        .from(userProfileTable)
        .where(eq(userProfileTable.userId, swipedUserId))
        .limit(1)
        .then((res) => res[0]),
      postgresDB
        .select()
        .from(userProfileTable)
        .where(eq(userProfileTable.userId, session.user.id))
        .limit(1)
        .then((res) => res[0]),
    ]);

    // Get email addresses
    const [swipedUser, currentUser] = await Promise.all([
      postgresDB
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, swipedUserId))
        .limit(1)
        .then((res) => res[0]),
      postgresDB
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.user.id))
        .limit(1)
        .then((res) => res[0]),
    ]);

    // Mark the existing match as mail sent
    await postgresDB
      .update(matchesTable)
      .set({ mailSent: true })
      .where(eq(matchesTable.id, matchRecord.id));

    const matchnotificationEmailTemplate =
      emailTemplates.matchNotificationEmail;

    // Send email to current user
    sendEmail({
      to: currentUser.email,
      subject: matchnotificationEmailTemplate.subject,
      text: matchnotificationEmailTemplate.text(
        swipedUserProfile.name,
        swipedUserProfile.instagramUsername,
      ),
      html: matchnotificationEmailTemplate.html(
        swipedUserProfile.name,
        swipedUserProfile.instagramUsername,
      ),
    });

    // Send email to swiped user
    sendEmail({
      to: swipedUser.email,
      subject: matchnotificationEmailTemplate.subject,
      text: matchnotificationEmailTemplate.text(
        currentUserProfile.name,
        currentUserProfile.instagramUsername,
      ),
      html: matchnotificationEmailTemplate.html(
        currentUserProfile.name,
        currentUserProfile.instagramUsername,
      ),
    });

    return data<ApiResponse>({
      success: true,
      message: "It's a match! Check your mail.",
    });
  } else {
    // No match yet, just record the like
    await postgresDB.insert(matchesTable).values({
      likeFormUser: session.user.id,
      likeToUser: swipedUserId,
    });

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
      axiosClient.post(
        "/user/home",
        {
          swipedUserId: user.id,
          direction,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
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
