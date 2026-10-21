"use client";

import { createContext, useContext } from "react";

export const IsOutgoingWorldContext = createContext<boolean>(false);

export function useIsOutgoingWorld(): boolean {
  return useContext(IsOutgoingWorldContext);
}
