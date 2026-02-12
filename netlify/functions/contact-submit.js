exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Method not allowed." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const subject = (body.subject || "").trim();
    const interest = (body.interest || "").trim();
    const message = (body.message || "").trim();
    const captchaToken = (body.captchaToken || "").trim();

    if (!name || !email || !message || !captchaToken) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Missing required fields." }),
      };
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Captcha key is not configured." }),
      };
    }

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", recaptchaSecret);
    verifyBody.append("response", captchaToken);

    const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody.toString(),
    });

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Captcha validation failed. Please retry." }),
      };
    }

    const submission = {
      name,
      email,
      subject,
      interest,
      message,
      createdAt: new Date().toISOString(),
    };

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || "zain.rahman@automatx.co.uk";
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "AutomatX <onboarding@resend.dev>";

    if (resendApiKey) {
      const emailSubject = subject || `New website inquiry from ${name}`;
      const emailText = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Interest: ${interest || "Not specified"}`,
        "",
        "Message:",
        message,
      ].join("\n");

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: emailSubject,
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error("Resend delivery failed", resendError);
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Message received, but delivery failed. Please email hello@automatx.co.uk directly." }),
        };
      }
    } else {
      console.warn("RESEND_API_KEY not configured; submission logged only.");
    }

    console.log("Contact form submission", {
      ...submission,
      messageLength: submission.message.length,
      message: undefined,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Thanks. Your message has been sent." }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Unexpected error. Please try again." }),
    };
  }
};
