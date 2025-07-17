const https = require("https");
const db = require("../config/db");
require("dotenv").config();

/**
 * Initializes a payment using Paystack and stores it in the database.
 */
const initializePayment = async (req, res) => {
  try {
    const { name, email, phone, amount, type } = req.body;

    if (!name || !email || !phone || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["donation", "dues"].includes(type)) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    if (amount < 100) {
      return res.status(400).json({ error: "Minimum amount is ₦100" });
    }

    const subaccount =
      type === "donation"
        ? process.env.PAYSTACK_DONATION_SUBACCOUNT
        : process.env.PAYSTACK_DUES_SUBACCOUNT;

    const reference = `ROGA91_${type.toUpperCase()}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const paystackPayload = JSON.stringify({
      email,
      amount: amount * 100,
      reference,
      subaccount,
      metadata: {
        name,
        email,
        phone,
        type,
        custom_fields: [
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: type === "donation" ? "Donation" : "Dues Payment",
          },
        ],
      },
      callback_url: `${process.env.BASE_URL}/api/payment/verify?reference=${reference}`,
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", async () => {
        try {
          const response = JSON.parse(data);

          if (response.status) {
            await db.query(
              "INSERT INTO payments (name, email, phone, amount, type, reference) VALUES ($1, $2, $3, $4, $5, $6)",
              [name, email, phone, amount, type, reference]
            );

            res.json({
              authorization_url: response.data.authorization_url,
              reference: reference,
            });
          } else {
            console.error("Paystack initialization failed:", response);
            res.status(500).json({ error: "Payment initialization failed" });
          }
        } catch (error) {
          console.error("Error parsing Paystack response:", error);
          res.status(500).json({ error: "Payment initialization failed" });
        }
      });
    });

    paystackReq.on("error", (error) => {
      console.error("Paystack request error:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    });

    paystackReq.write(paystackPayload);
    paystackReq.end();
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Verifies a payment using Paystack and updates the DB record.
 */
const verifyPayment = async (req, res) => {
  try {
      let reference = req.query.reference;
    if (Array.isArray(reference)) {
      reference = reference[0]; 
       }

    if (!reference) {
      return res.redirect("/failure.html");
    }
console.log("Verifying reference:", reference);
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", async () => {
        try {
          const result = JSON.parse(data);
          console.log(result)

          if (result.status && result.data.status === "success") {
            await db.query(
              "UPDATE payments SET verified = true, verified_at = NOW() WHERE reference = $1",
              [reference]
            );
            return res.redirect("/success.html");
          } else {
            await db.query(
              "UPDATE payments SET verified = false, verified_at = NOW() WHERE reference = $1",
              [reference]
            );
            return res.redirect("/failure.html");
          }
        } catch (error) {
          console.error("Error parsing verification response:", error);
          return res.redirect("/failure.html");
        }
      });
    });

    paystackReq.on("error", (error) => {
      console.error("Payment verification error:", error);
      res.redirect("/failure.html");
    });

    paystackReq.end();
  } catch (error) {
    console.error("Payment verification error:", error);
    res.redirect("/failure.html");
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};
