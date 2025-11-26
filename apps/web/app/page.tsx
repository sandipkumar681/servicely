import { UserModelType } from "@servicely/types";
import { a } from "../../../packages/types/src";

export default function Home() {
  const user: UserModelType = {
    userName: "sandip",
    email: "sandip@example.com",
  };

  return (
    <>
      <h1>Hello, {user.userName}</h1>
      <p>{a}</p>
    </>
  );
}
