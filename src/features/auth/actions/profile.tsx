"use server";

import { UpdateProfileSchema } from "@/features/admin/schemas/user";
import { hashSecurityAnswer, logActivity } from "@/lib/helper/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ResetPasswordPayload } from "../types";

export async function setupProfileAction(values: any) {
  const supabase = await createClient();

  // 1. Get Current User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Session expired." };

  // 2. Validation
  const validatedFields = UpdateProfileSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid input. Check password requirements.",
    };
  }

  const { password, security_question_id, security_answer } =
    validatedFields.data;

  try {
    // 3. Update Supabase Auth Password (Supabase handles Bcrypt hashing here)
    if (password) {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw new Error(authError.message);
    }

    // 4. Custom Scrypt Hashing for Security Answer
    // We only hash if an answer was provided
    let hashedAnswer = null;
    if (security_answer) {
      hashedAnswer = await hashSecurityAnswer(security_answer);
    }

    // 5. Update Profile Table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        security_question_id,
        security_answer_hash: hashedAnswer,
        is_setup_complete: true,
      })
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);

    // 6. TASK 7: Log Activity
    await supabase.from("activity_logs").insert({
      event_type: "PROFILE_SETUP_COMPLETE",
      status: "SUCCESS",
      username: user.email,
    });

    return { success: true, message: "Profile secured successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred." };
  }
}
export async function resetPasswordAction(values: ResetPasswordPayload) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  const { password, tokenOrCode } = values;

  if (!tokenOrCode) {
    return {
      success: false,
      message: "Recovery token or code is missing. Please request a new link.",
    };
  }

  try {
    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(tokenOrCode);

    if (exchangeError || !exchangeData.user) {
      throw new Error(
        exchangeError?.message || "The reset link is invalid or has expired.",
      );
    }

    const targetUser = exchangeData.user;

    const { error: authError } = await supabase.auth.updateUser({
      password: password,
    });

    if (authError) throw new Error(authError.message);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", targetUser.id)
      .single();

    // Log the event as a standard self-update
    await logActivity(supabaseAdmin, {
      userId: targetUser.id,
      username: profile?.username || "System",
      event: `PASSWORD_RESET_UNAUTHENTICATED`,
      status: "SUCCESS",
    });

    return { success: true, message: "Password updated successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Update failed." };
  }
}
