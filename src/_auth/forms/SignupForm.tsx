import { z } from "zod";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/toaster";
import {Form,FormControl,FormField,FormItem,FormLabel,FormMessage,} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Signupvalidation } from "@/lib/validation";
import Loader from "@/components/ui/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import {
  userCreateUserAccount,
  userSignInAccount,
} from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

const SignupForm = () => {
  const { toast } = useToast();
  const { checkAuthUser, setIsAuthenticated } = useUserContext();
  const navigate = useNavigate();

  const { mutateAsync: createUserAccount, isPending: isCreatingAccount } =
    userCreateUserAccount();

  const { mutateAsync: signInAccount, isPending: isSigningIn } =
    userSignInAccount();

  const form = useForm<z.infer<typeof Signupvalidation>>({
    resolver: zodResolver(Signupvalidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof Signupvalidation>) {
    try {
      const newUser = await createUserAccount(values);
      if (!newUser) {
        toast({ title: "Sign up failed. Please try again." });
        return;
      }

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
    } catch (error) {
      console.error("Error in SignupForm onSubmit:", error);
      toast({ title: "Something went wrong. Please try again." });
    }
  }

  return (
    <div>
      <Form {...form}>
        <div className="sm:w-[420px] flex items-center justify-center flex-col">
          <img src="/assets/images/logo.svg" alt="logo" />
          <h2 className="h3-bold md:h2-bold mt-4">Create an account</h2>
          <p className="text-light-3 small-medium md:base-regular mt-2">
            To use Snapgram enter your details
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-col gap-5 w-full mt-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              {isCreatingAccount ? (
                <div className="flex-centre gap-2">
                  <Loader /> Loading...
                </div>
              ) : (
                "Sign up"
              )}
            </Button>
            <p className="text-small-regular text-light-2 text-center mt-2">
              Already have an account?
              <Link
                to="/sign-in"
                className="text-primary-500 text-small-semibold ml-1"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default SignupForm;
