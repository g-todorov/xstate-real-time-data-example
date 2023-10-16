"use client";

import { AppContext } from "@/contexts/app";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [state, send] = AppContext.useActor();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (state.matches("authenticated")) {
      router.push("/");
    } else {
      setIsRedirecting(false);
    }
  }, [state.value]);

  if (isRedirecting) {
    return null;
  }

  return (
    <main>
      <div>
        <h3>Sign In:</h3>
      </div>
      <div>
        <button
          onClick={() => {
            send({ type: "SIGN_IN" });
          }}
        >
          {state.matches("unauthenticated.signingIn")
            ? "...loading"
            : "sign in"}
        </button>
      </div>
    </main>
  );
}
