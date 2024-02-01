import React, { Suspense, useEffect } from "react";
import LoadingSpinner from "../components/UI/LoadingSpinner";
const LoginForm = React.lazy(() => import("../components/LoginForm/LoginForm"));
import useUser from "../hooks/use-user";

const Home = () => {
  useUser({
    redirectIfFound: true,
    redirectTo: "/",
  });

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
};
export default Home;
