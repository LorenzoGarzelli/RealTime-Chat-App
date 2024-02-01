import { redirect, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (...args: string[]) =>
  //@ts-ignore
  fetch(...args)
    .then((res) => {
      return res.json();
    })
    .then((data) => data);

const handleLogout = async () => {
  const url = "api/v1/users/logout";
  await fetch(url, { credentials: "include" });
};

export default function useUser({
  redirectTo = "",
  redirectIfFound = false,
} = {}) {
  let navigate = useNavigate();
  const { data, mutate } = useSWR("/api/v1/users/isLoggedIn", fetcher);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem("token") || !localStorage.getItem("roomId")) {
      handleLogout();
    }
    if (data) setIsLoading(false);
    if (!redirectTo || !data) return;
    if (
      (redirectTo && !redirectIfFound && !data?.isLoggedIn) ||
      (redirectIfFound && data?.isLoggedIn)
    ) {
      navigate(redirectTo, { replace: true });
    }
  }, [data, redirectIfFound, redirectTo, mutate]);

  return { ...data, isLoading, mutate };
}
