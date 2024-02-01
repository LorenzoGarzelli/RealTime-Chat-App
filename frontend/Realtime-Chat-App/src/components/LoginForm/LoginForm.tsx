import React from "react";
import styles from "./LoginForm.module.css";
import { Controller, useForm, SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import useUser from "../../hooks/use-user";

type Inputs = {
  phoneNumber: string;
  password: string;
};

const LoginForm = () => {
  const { user, isLoggedIn } = useUser({
    redirectTo: "/",
    redirectIfFound: true,
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      phoneNumber: "",
    },
  });

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<Inputs> = async (input, e) => {
    e?.preventDefault();
    // removing white spaces
    input.phoneNumber = input.phoneNumber.replace(/\s/g, "");
    console.log(input);

    const res = await fetch("/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        phoneNumber: input.phoneNumber,
        password: input.password,
      }),

      headers: { "Content-type": "application/json" },
    });
    if (res.status === 200) {
      const data = await res.json();
      const { user } = data.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("roomId", user.roomId);

      navigate("/", { replace: true });
    }
  };

  return (
    <div className={styles["container"]}>
      <h2 className={styles["title"]}>Login</h2>
      <span className={styles["description"]}>start chatting Now!</span>
      <form onSubmit={handleSubmit(onSubmit)}>
        <>
          <div className={styles["input-wrapper"]}>
            <label>Phone Number</label>

            <Controller
              name="phoneNumber"
              control={control}
              rules={{ validate: matchIsValidTel, required: true }}
              render={({ field, fieldState }) => (
                <MuiTelInput
                  {...field}
                  className={`${styles["input"]} ${
                    errors.password ? styles["input--invalid"] : ""
                  }`}
                  error={fieldState.invalid}
                />
              )}
            />

            {errors.phoneNumber && (
              <span className={styles["input-error"]}>
                Phone number is Invalid
              </span>
            )}
          </div>

          <div className={styles["input-wrapper"]}>
            <label>Password</label>
            <input
              className={`${styles["input"]} ${
                errors.password ? styles["input--invalid"] : ""
              }`}
              placeholder="your password"
              type="password"
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password", { required: true })}
            />

            {errors.password && (
              <span className={styles["input-error"]}>
                Password field is required
              </span>
            )}
          </div>

          <div className={styles["input-wrapper"]}>
            <Link
              className={`${styles["link"]} ${styles["link--right"]}`}
              to={"/"}
            >
              Forget password?
            </Link>
          </div>
          <button type="submit" className={styles["submit-button"]}>
            Login
          </button>
          <span className={styles["form-footer"]}>
            Not registered yet?{" "}
            <Link className={styles["link"]} to="/">
              Create an Account
            </Link>
          </span>
        </>
      </form>
    </div>
  );
};

export default LoginForm;
