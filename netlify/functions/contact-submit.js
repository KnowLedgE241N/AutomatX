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

    console.log("Contact form submission", {
      name,
      email,
      subject,
      interest,
      messageLength: message.length,
      createdAt: new Date().toISOString(),
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
