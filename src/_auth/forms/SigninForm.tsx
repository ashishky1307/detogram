import { z } from "zod";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/toaster";
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage,} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Signinvalidation} from "@/lib/validation";
import Loader from "@/components/ui/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import { userSignInAccount
} from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

const SigninForm = () => {
  const { toast } = useToast();
  const { checkAuthUser, setIsAuthenticated } = useUserContext();
  const navigate = useNavigate();

  const { mutateAsync: signInAccount, isPending } =
    userSignInAccount();

  const form = useForm<z.infer<typeof Signinvalidation>>({
    resolver: zodResolver(Signinvalidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof Signinvalidation>) {

      const session = await signInAccount({
        email: values.email,
        password: values.password,
      });

      if (!session) {
        toast({ title: "Sign in failed. Please try again." });
        return;
      }

      const isLoggedin = await checkAuthUser();
      if (isLoggedin) {
        setIsAuthenticated(true);
        form.reset();
        navigate("/");
      } else {
        toast({ title: "Sign up failed. Please try again." });
      }
  }

  return (
    <div>
      <Form {...form}>
        <div className="sm:w-[420px] flex items-center justify-center flex-col">
          <img src="/assets/images/logo.svg" alt="logo" />
          <h2 className="h3-bold md:h2-bold mt-4">Log in to your account</h2>
          <p className="text-light-3 small-medium md:base-regular mt-2">
            welcome back! Please enter your details
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-col gap-5 w-full mt-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="shad-button_primary w-full mt-4">
              {isPending ? (
                <div className="flex-centre gap-2">
                  <Loader /> Loading...
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
            <p className="text-small-regular text-light-2 text-center mt-2">
              Don't have an account?
              <Link
                to="/sign-up"
                className="text-primary-500 text-small-semibold ml-1"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default SigninForm;
