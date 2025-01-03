import { z } from "zod";

export const Signupvalidation= z.object({
    name: z.string().min(2 , {message: 'Too Short'}),
    username: z.string().min(2 , {message: 'Too Short'}),
    email: z.string().email(),
    password: z.string().min(8 , {message: ' password must be at least 8 character'}),
  });
   