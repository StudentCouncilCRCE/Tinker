import { TinderStack } from "~/components/layout/tinder-stack";
import { mockUsers } from "~/data/mock/mock.d";

// Assume data is imported or passed as props
// import { data } from "@/data/mock-users";

export default function Page() {
  return (
    <>
      <TinderStack
        users={mockUsers}
        onRightSwipe={(user) => console.log("Liked:", user)}
        onLeftSwipe={(user) => console.log("Passed:", user)}
      />
    </>
  );
}
