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

export default function useUser({
  redirectTo = "",
  redirectIfFound = false,
} = {}) {
  let navigate = useNavigate();
  const { data, mutate } = useSWR("/api/v1/users/isLoggedIn", fetcher);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
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
