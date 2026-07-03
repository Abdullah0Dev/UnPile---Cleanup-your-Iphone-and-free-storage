import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase (using public anon key is perfectly safe with RLS enabled)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from("waitlist_unpile")
      .insert({ email: email });

    if (dbError) {
      // Error code 23505 = Postgres unique constraint violation (Duplicate email)
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "This email is already on the waitlist!" }, { status: 409 });
      }
      console.error("Supabase error:", dbError);
      return NextResponse.json({ error: "Failed to save to database." }, { status: 500 });
    }

    // 2. Send the Waitlist Confirmation Email via Resend
    // const { error: emailError } = await resend.emails.send({
    //   from: "Unpile <onboarding@resend.dev>", // Replace with your verified domain later
    //   to: [email],
    //   subject: "Welcome to the Unpile Waitlist!",
    //   html: `
    //     <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    //       <h1 style="color: #8b5cf6;">You're on the waitlist!</h1>
    //       <p>Thanks for signing up for <strong>Unpile</strong>.</p>
    //       <p>We'll notify you the moment early access goes live.</p>
    //       <p style="margin-top: 24px; font-size: 12px; color: #999;">— The Unpile Team</p>
    //     </div>
    //   `,
    // });

    // if (emailError) {
    //   console.error("Resend error:", emailError);
    //   // We don't throw an error to the user because the DB was saved successfully.
    // }

    return NextResponse.json({ success: true, message: "You're on the list! Thanks for Joining." }, { status: 200 });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}