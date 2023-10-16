"use client";

import React, { PropsWithChildren } from "react";
import { assign, createMachine } from "xstate";
import { createActorContext } from "@xstate/react";
import { onAuthStateChanged, getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  query,
  collection,
} from "firebase/firestore";

import firebaseApp from "@/firebase";

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

interface Message {
  sender: string;
  text: string;
}

const appMachine = createMachine(
  {
    context: { uid: "", messages: [] },
    predictableActionArguments: true,
    tsTypes: {} as import("./app.typegen").Typegen0,
    schema: {
      context: {} as { uid: string; messages: Message[] },
      events: {} as
        | { type: "GO_TO_AUTHENTICATED"; uid: string }
        | { type: "GO_TO_UNAUTHENTICATED" }
        | { type: "END_TRANSITION" }
        | { type: "SIGN_IN" }
        | { type: "SIGN_OUT" }
        | { type: "ADD_MESSAGE" }
        | { type: "SET_MESSAGES"; messages: Message[] },
      services: {} as {
        addMessage: { data: void };
        signIn: { data: void };
        signOut: { data: void };
      },
    },
    invoke: { src: "userSubscriber" },
    on: {
      GO_TO_AUTHENTICATED: {
        actions: ["setUid"],
        target: "authenticated",
        internal: true,
      },
      GO_TO_UNAUTHENTICATED: { target: "unauthenticated", internal: true },
    },
    initial: "loading",
    states: {
      loading: { tags: "loading" },
      authenticated: {
        invoke: { src: "messagesSubscriber" },
        on: {
          SIGN_OUT: { target: ".signingOut" },
          ADD_MESSAGE: { target: ".addingMessage" },
          SET_MESSAGES: { actions: ["setMessages"] },
        },
        initial: "idle",
        states: {
          idle: {},
          signingOut: {
            invoke: { src: "signOut", onDone: { target: "idle" } },
          },
          addingMessage: {
            invoke: {
              src: "addMessage",
              onDone: { target: "idle" },
              onError: {
                actions: ["logError"],
              },
            },
          },
        },
      },
      unauthenticated: {
        on: {
          SIGN_IN: { target: ".signingIn" },
        },
        initial: "idle",
        states: {
          idle: {},
          signingIn: { invoke: { src: "signIn", onDone: { target: "idle" } } },
        },
      },
    },
  },
  {
    actions: {
      setUid: assign({
        uid: (context, event) => {
          return event.uid;
        },
      }),
      setMessages: assign({
        messages: (context, event) => {
          return event.messages;
        },
      }),
      logError(context, event) {
        console.log(event);
      },
    },
    services: {
      userSubscriber() {
        return (sendBack) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              sendBack({ type: "GO_TO_AUTHENTICATED", uid: user.uid });
            } else {
              sendBack({ type: "GO_TO_UNAUTHENTICATED" });
            }
          });
          return () => unsubscribe();
        };
      },
      messagesSubscriber() {
        return (sendBack) => {
          const unsubscribe = onSnapshot(
            query(collection(firestore, "messages")),
            (querySnapshot) => {
              const messages: Message[] = [];
              querySnapshot.forEach((doc) => {
                messages.push(doc.data().name);
              });

              sendBack({ type: "SET_MESSAGES", messages });
            }
          );

          return () => unsubscribe();
        };
      },
      async addMessage(context, event) {
        await setDoc(doc(firestore, "messages", `${Date.now()}`), {
          sender: context.uid,
          text: "Lorem Ipsumm",
        });
      },
      async signIn() {
        await signInAnonymously(auth);
      },
      async signOut() {
        await auth.signOut();
      },
    },
  }
);

export const AppContext = createActorContext(appMachine);

export function AppProvider({ children }: PropsWithChildren<{}>) {
  return <AppContext.Provider>{children}</AppContext.Provider>;
}
