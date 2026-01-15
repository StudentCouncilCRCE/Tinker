import { authClient } from "~/lib/auth.client";

export default function UserSignoutRoute() {

    authClient.signOut();
    return null;
}