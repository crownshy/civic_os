import { z } from 'zod';

const otpUserSignupSchema = z.object({
	email: z.string().email('Please enter a valid email'),
	username: z.string().min(5, { message: 'username must have at least 5 characters' })
});

export type OtpUserSignupSchema = z.infer<typeof otpUserSignupSchema>;

export default otpUserSignupSchema;
