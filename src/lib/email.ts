import {
  PICKUP_LOCATION,
  PICKUP_ADDRESS_INLINE,
  PICKUP_DIRECTIONS_URL,
  DEFAULT_PICKUP_TIME,
  DEFAULT_DROPOFF_TIME,
} from "./location";
import { SAME_DAY_REQUEST_EXPIRY_HOURS } from "./booking-window";

const SAME_DAY_REQUEST_EXPIRY_HOURS_LABEL = `${SAME_DAY_REQUEST_EXPIRY_HOURS} hour${
  (SAME_DAY_REQUEST_EXPIRY_HOURS as number) === 1 ? "" : "s"
}`;

interface BookingConfirmationInput {
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate: string;
  pickupTime?: string;
  dropoffTime?: string;
  totalDays: number;
  bikeCount: number;
  totalPrice: number;
}

interface InternalNotificationInput extends BookingConfirmationInput {
  phone?: string;
  livemode: boolean;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const SENDER = { name: "Vintage Rides USA", email: "bookings@vintagerides.com" };
const REPLY_TO = { name: "Vintage Rides USA", email: "wendy@vintagerides.travel" };

const INTERNAL_RECIPIENTS = [
  { email: "wendy@vintagerides.travel", name: "Wendy" },
  { email: "johann@vintagerides.com", name: "Johann" },
  { email: "loomeronset@icloud.com", name: "Michael Loomer" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function fmtMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function pickupTimeOf(b: BookingConfirmationInput): string {
  return b.pickupTime?.trim() || DEFAULT_PICKUP_TIME;
}

function dropoffTimeOf(b: BookingConfirmationInput): string {
  return b.dropoffTime?.trim() || DEFAULT_DROPOFF_TIME;
}

export async function sendBookingConfirmation(b: BookingConfirmationInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY missing — skipping booking confirmation email");
    return;
  }

  const subject = `Your Vintage Rides USA booking is confirmed — ${b.bookingId}`;
  const html = renderHtml(b);
  const text = renderText(b);

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      replyTo: REPLY_TO,
      to: [{ email: b.email, name: `${b.firstName} ${b.lastName}`.trim() }],
      subject,
      htmlContent: html,
      textContent: text,
      tags: ["booking-confirmation", "vintage-rides-usa"],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo send failed ${res.status}: ${body}`);
  }
}

function renderHtml(b: BookingConfirmationInput): string {
  const bikeWord = b.bikeCount === 1 ? "bike" : "bikes";
  const pTime = pickupTimeOf(b);
  const dTime = dropoffTimeOf(b);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Booking confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a28;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e6e0;">
          <tr>
            <td style="background:#111110;padding:32px 32px 28px;text-align:left;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a45a;margin-bottom:10px;">Booking confirmed</div>
              <div style="color:#ffffff;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">VINTAGE RIDES <span style="color:#c8a45a;font-weight:400;letter-spacing:0.12em;">USA</span></div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:300;line-height:1.25;color:#111110;">Hi ${escapeHtml(b.firstName)}, you're booked.</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.55;color:#5b5b58;">Thanks for choosing Vintage Rides USA. Your Royal Enfield Himalayan 450 ${b.bikeCount === 1 ? "is" : "are"} reserved. Pickup details and route suggestions will land in your inbox 7 days before your start date.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e6e0;border-radius:2px;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e8e6e0;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Booking reference</div>
                    <div style="font-size:16px;font-family:'SF Mono',Menlo,Consolas,monospace;color:#111110;">${escapeHtml(b.bookingId)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e8e6e0;border-right:1px solid #e8e6e0;width:50%;">
                          <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Pickup</div>
                          <div style="font-size:15px;color:#111110;">${fmtDate(b.startDate)}</div>
                          <div style="font-size:13px;color:#5b5b58;margin-top:2px;">${escapeHtml(pTime)}</div>
                        </td>
                        <td style="padding:18px 20px;border-bottom:1px solid #e8e6e0;width:50%;">
                          <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Return</div>
                          <div style="font-size:15px;color:#111110;">${fmtDate(b.endDate)}</div>
                          <div style="font-size:13px;color:#5b5b58;margin-top:2px;">${escapeHtml(dTime)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e8e6e0;border-right:1px solid #e8e6e0;width:50%;">
                          <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Duration</div>
                          <div style="font-size:15px;color:#111110;">${b.totalDays} ${b.totalDays === 1 ? "day" : "days"}</div>
                        </td>
                        <td style="padding:18px 20px;border-bottom:1px solid #e8e6e0;width:50%;">
                          <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Bikes</div>
                          <div style="font-size:15px;color:#111110;">${b.bikeCount} ${bikeWord}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;background:#faf8f3;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:4px;">Total paid</div>
                    <div style="font-size:22px;font-weight:300;color:#111110;">${fmtMoney(b.totalPrice)}</div>
                    <div style="font-size:11px;color:#8a8a86;margin-top:2px;">Tax included · paid via Stripe</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c8a45a;margin-bottom:12px;">Pickup location</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e6e0;border-radius:2px;background:#faf8f3;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:15px;font-weight:600;color:#111110;margin-bottom:4px;">${escapeHtml(PICKUP_LOCATION.name)}</div>
                    <div style="font-size:14px;color:#2a2a28;line-height:1.5;">${escapeHtml(PICKUP_LOCATION.street)}<br />${escapeHtml(PICKUP_LOCATION.city)}, ${escapeHtml(PICKUP_LOCATION.state)} ${escapeHtml(PICKUP_LOCATION.zip)}</div>
                    <div style="font-size:13px;color:#2a2a28;margin-top:10px;">Pickup at <strong style="color:#111110;">${escapeHtml(pTime)}</strong> · Return by <strong style="color:#111110;">${escapeHtml(dTime)}</strong></div>
                    <a href="${PICKUP_DIRECTIONS_URL}" style="display:inline-block;margin-top:12px;font-size:13px;color:#c8a45a;text-decoration:none;font-weight:600;">Get directions →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c8a45a;margin-bottom:14px;">What's next</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${[
                  "Save this email — your booking reference is your check-in code.",
                  `On your start date, head to ${PICKUP_ADDRESS_INLINE} for ${pTime} pickup. Return by ${dTime} on your end date.`,
                  // The website no longer asks for a licence number, so the
                  // reminder to bring the licence itself has to live here.
                  "Bring your driver's license with a motorcycle endorsement — we check it at pickup. International riders also need an International Driving Permit.",
                  "Want GPX routes for the Black Hills, Badlands or Needles Highway? Just reply.",
                ]
                  .map(
                    (line, i) => `
                <tr>
                  <td style="padding:6px 0;font-size:14px;line-height:1.5;color:#2a2a28;">
                    <span style="color:#c8a45a;font-weight:600;margin-right:8px;">${i + 1}.</span> ${escapeHtml(line)}
                  </td>
                </tr>`
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 36px;">
              <p style="margin:0;font-size:13px;line-height:1.55;color:#5b5b58;">Questions? Just hit reply — your message will reach the team in Rapid City directly.</p>
            </td>
          </tr>

          <tr>
            <td style="background:#111110;padding:22px 32px;text-align:left;">
              <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a86;margin-bottom:6px;">Vintage Rides USA</div>
              <div style="font-size:12px;color:#8a8a86;line-height:1.55;">A Vintage Rides company · Royal Enfield Himalayan 450 rentals · Rapid City, SD<br /><a href="https://www.vintageridesusa.com" style="color:#c8a45a;text-decoration:none;">vintageridesusa.com</a></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(b: BookingConfirmationInput): string {
  const bikeWord = b.bikeCount === 1 ? "bike" : "bikes";
  const pTime = pickupTimeOf(b);
  const dTime = dropoffTimeOf(b);
  return [
    `BOOKING CONFIRMED — Vintage Rides USA`,
    ``,
    `Hi ${b.firstName},`,
    ``,
    `Thanks for choosing Vintage Rides USA. Your Royal Enfield Himalayan 450 ${b.bikeCount === 1 ? "is" : "are"} reserved.`,
    ``,
    `Booking reference: ${b.bookingId}`,
    `Pickup:   ${fmtDate(b.startDate)} · ${pTime}`,
    `Return:   ${fmtDate(b.endDate)} · ${dTime}`,
    `Duration: ${b.totalDays} ${b.totalDays === 1 ? "day" : "days"}`,
    `Bikes:    ${b.bikeCount} ${bikeWord}`,
    `Total:    ${fmtMoney(b.totalPrice)} (tax included, paid via Stripe)`,
    ``,
    `Pickup location:`,
    `  ${PICKUP_LOCATION.name}`,
    `  ${PICKUP_LOCATION.street}`,
    `  ${PICKUP_LOCATION.city}, ${PICKUP_LOCATION.state} ${PICKUP_LOCATION.zip}`,
    `  Pickup at ${pTime} · Return by ${dTime}`,
    `  Directions: ${PICKUP_DIRECTIONS_URL}`,
    ``,
    `What's next:`,
    `1. Save this email — your booking reference is your check-in code.`,
    `2. On your start date, head to ${PICKUP_ADDRESS_INLINE} for ${pTime} pickup. Return by ${dTime} on your end date.`,
    `3. Bring your driver's license with a motorcycle endorsement — we check it at pickup. International riders also need an International Driving Permit.`,
    `4. Want GPX routes for the Black Hills, Badlands or Needles Highway? Just reply.`,
    ``,
    `Questions? Reply to this email.`,
    ``,
    `Vintage Rides USA — A Vintage Rides company`,
    `Royal Enfield Himalayan 450 rentals — Rapid City, SD`,
    `https://www.vintageridesusa.com`,
  ].join("\n");
}

// ── Same-day request-to-book emails ─────────────────────────────────────────

interface BrevoMessage {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

async function sendBrevo(msg: BrevoMessage, context: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error(`BREVO_API_KEY missing — skipping ${context}`);
    return;
  }
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: SENDER,
      replyTo: msg.replyTo ?? REPLY_TO,
      to: msg.to,
      subject: msg.subject,
      htmlContent: msg.html,
      textContent: msg.text,
      tags: msg.tags ?? ["vintage-rides-usa"],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${context} failed ${res.status}: ${body}`);
  }
}

/** Customer email right after a same-day booking is REQUESTED (card authorized, not charged). */
export async function sendBookingRequestReceived(b: BookingConfirmationInput): Promise<void> {
  const pTime = pickupTimeOf(b);
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a28;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e0;">
    <tr><td style="background:#111110;padding:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a45a;">Request received</div>
      <div style="color:#ffffff;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-top:8px;">VINTAGE RIDES <span style="color:#c8a45a;font-weight:400;">USA</span></div>
    </td></tr>
    <tr><td style="padding:32px 28px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:300;color:#111110;">Hi ${escapeHtml(b.firstName)}, we've got your same-day request.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5b5b58;">Because you're riding today, your booking is a quick request rather than an instant confirmation. <strong style="color:#111110;">We've authorized ${fmtMoney(b.totalPrice)} on your card but not charged it.</strong> Our team in Rapid City will confirm a bike is ready and only then complete the payment — usually within a couple of hours.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5b5b58;">If we can't get you on a bike today, the hold is released automatically and you're charged nothing.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e6e0;border-radius:2px;margin-top:8px;">
        <tr><td style="padding:16px 20px;font-size:14px;line-height:1.7;color:#2a2a28;">
          <div><span style="color:#8a8a86;">Reference:</span> <strong>${escapeHtml(b.bookingId)}</strong></div>
          <div><span style="color:#8a8a86;">Pickup:</span> ${fmtDate(b.startDate)} · ${escapeHtml(pTime)}</div>
          <div><span style="color:#8a8a86;">Bikes:</span> ${b.bikeCount}</div>
          <div><span style="color:#8a8a86;">Authorized:</span> ${fmtMoney(b.totalPrice)} (not yet charged)</div>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#8a8a86;">Questions? Just reply — you'll reach the team directly.</p>
    </td></tr>
  </table></body></html>`;
  const text = [
    `REQUEST RECEIVED — Vintage Rides USA`,
    ``,
    `Hi ${b.firstName},`,
    ``,
    `Because you're riding today, this is a request rather than an instant booking.`,
    `We've authorized ${fmtMoney(b.totalPrice)} on your card but NOT charged it. Our team`,
    `will confirm a bike is ready and only then take payment (usually within a couple hours).`,
    `If we can't confirm today, the hold is released and you're charged nothing.`,
    ``,
    `Reference: ${b.bookingId}`,
    `Pickup:    ${fmtDate(b.startDate)} · ${pTime}`,
    `Bikes:     ${b.bikeCount}`,
    `Authorized: ${fmtMoney(b.totalPrice)} (not yet charged)`,
    ``,
    `Questions? Reply to this email.`,
  ].join("\n");
  await sendBrevo(
    { to: [{ email: b.email, name: `${b.firstName} ${b.lastName}`.trim() }], subject: `We've got your same-day request — ${b.bookingId}`, html, text, tags: ["booking-request-received", "vintage-rides-usa"] },
    "booking request-received email"
  );
}

/** Customer email when a same-day request is declined or auto-released (hold cancelled). */
export async function sendBookingDeclined(b: BookingConfirmationInput): Promise<void> {
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a28;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e0;">
    <tr><td style="background:#111110;padding:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a45a;">Booking update</div>
      <div style="color:#ffffff;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-top:8px;">VINTAGE RIDES <span style="color:#c8a45a;font-weight:400;">USA</span></div>
    </td></tr>
    <tr><td style="padding:32px 28px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:300;color:#111110;">Hi ${escapeHtml(b.firstName)}, we couldn't confirm a bike for today.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5b5b58;">Unfortunately we weren't able to get you on a bike for your same-day request (${escapeHtml(b.bookingId)}). <strong style="color:#111110;">The ${fmtMoney(b.totalPrice)} hold on your card has been released — you have not been charged.</strong></p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5b5b58;">We'd love to get you riding on another day. Just reply to this email or book again on the site and we'll sort it out.</p>
      <p style="margin:20px 0 0;font-size:13px;color:#8a8a86;">Sorry for the inconvenience — the team in Rapid City.</p>
    </td></tr>
  </table></body></html>`;
  const text = [
    `BOOKING UPDATE — Vintage Rides USA`,
    ``,
    `Hi ${b.firstName},`,
    ``,
    `We weren't able to confirm a bike for your same-day request (${b.bookingId}).`,
    `The ${fmtMoney(b.totalPrice)} hold on your card has been released — you have NOT been charged.`,
    ``,
    `We'd love to get you riding another day. Reply to this email or book again anytime.`,
    ``,
    `Sorry for the inconvenience — the team in Rapid City.`,
  ].join("\n");
  await sendBrevo(
    { to: [{ email: b.email, name: `${b.firstName} ${b.lastName}`.trim() }], subject: `Update on your same-day request — ${b.bookingId}`, html, text, tags: ["booking-declined", "vintage-rides-usa"] },
    "booking declined email"
  );
}

interface RequestNotificationInput extends InternalNotificationInput {
  acceptUrl: string;
  declineUrl: string;
}

/** Internal PENDING alert with one-click Accept / Decline for a same-day request. */
export async function sendInternalBookingRequest(b: RequestNotificationInput): Promise<void> {
  const fullName = `${b.firstName} ${b.lastName}`.trim() || "(no name)";
  const pTime = pickupTimeOf(b);
  const dTime = dropoffTimeOf(b);
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a28;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e0;">
    <tr><td style="background:#b34b00;padding:20px 24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#ffd9b3;">Same-day request · action required</div>
      <div style="color:#ffffff;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-top:6px;">VINTAGE RIDES USA</div>
    </td></tr>
    <tr><td style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#2a2a28;">A customer wants to ride <strong>today</strong>. Their card is <strong>authorized for ${fmtMoney(b.totalPrice)} but not charged</strong>. Accept to capture payment and confirm, or Decline to release the hold.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.6;color:#2a2a28;">
        <tr><td style="padding:5px 0;color:#8a8a86;width:130px;">Booking</td><td style="font-family:'SF Mono',Menlo,monospace;color:#111110;">${escapeHtml(b.bookingId)}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Customer</td><td style="color:#111110;font-weight:600;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Email</td><td><a href="mailto:${escapeHtml(b.email)}" style="color:#c8a45a;text-decoration:none;">${escapeHtml(b.email)}</a></td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Phone</td><td>${b.phone ? escapeHtml(b.phone) : '<span style="color:#8a8a86;">(not provided)</span>'}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Pickup</td><td style="color:#111110;">${fmtDate(b.startDate)} · ${escapeHtml(pTime)}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Return</td><td style="color:#111110;">${fmtDate(b.endDate)} · ${escapeHtml(dTime)}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Bikes</td><td style="color:#111110;">${b.bikeCount}</td></tr>
        <tr><td style="padding:5px 0;color:#8a8a86;">Authorized</td><td style="color:#111110;font-weight:600;">${fmtMoney(b.totalPrice)} (hold)</td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
        <tr>
          <td style="padding-right:12px;"><a href="${b.acceptUrl}" style="display:inline-block;background:#2e7d32;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:3px;">✓ Accept &amp; charge</a></td>
          <td><a href="${b.declineUrl}" style="display:inline-block;background:#ffffff;color:#b3261e;border:1px solid #e0c0bc;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:3px;">✕ Decline &amp; release</a></td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:12px;color:#8a8a86;">If nobody acts, the hold auto-releases in ${SAME_DAY_REQUEST_EXPIRY_HOURS_LABEL}. You can also handle it in the garage.</p>
    </td></tr>
  </table></body></html>`;
  const text = [
    `SAME-DAY REQUEST — ACTION REQUIRED — Vintage Rides USA`,
    ``,
    `A customer wants to ride TODAY. Card authorized for ${fmtMoney(b.totalPrice)}, not charged.`,
    ``,
    `Booking:    ${b.bookingId}`,
    `Customer:   ${fullName}`,
    `Email:      ${b.email}`,
    `Phone:      ${b.phone || "(not provided)"}`,
    `Pickup:     ${fmtDate(b.startDate)} · ${pTime}`,
    `Return:     ${fmtDate(b.endDate)} · ${dTime}`,
    `Bikes:      ${b.bikeCount}`,
    `Authorized: ${fmtMoney(b.totalPrice)} (hold)`,
    ``,
    `ACCEPT & charge:   ${b.acceptUrl}`,
    `DECLINE & release: ${b.declineUrl}`,
    ``,
    `If nobody acts, the hold auto-releases in ${SAME_DAY_REQUEST_EXPIRY_HOURS_LABEL}.`,
  ].join("\n");
  await sendBrevo(
    { to: INTERNAL_RECIPIENTS, subject: `${b.livemode ? "" : "[TEST] "}⚡ Same-day request · ${fullName} · ${b.bookingId}`, html, text, replyTo: { email: b.email, name: fullName }, tags: ["booking-request-internal", "vintage-rides-usa", b.livemode ? "live" : "test"] },
    "internal booking request email"
  );
}

export async function sendInternalBookingNotification(b: InternalNotificationInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY missing — skipping internal booking notification");
    return;
  }

  const tag = b.livemode ? "" : " [TEST]";
  const subject = `${b.livemode ? "" : "[TEST] "}New booking · ${b.firstName} ${b.lastName} · ${b.bookingId}`;
  const fullName = `${b.firstName} ${b.lastName}`.trim() || "(no name)";
  const pTime = pickupTimeOf(b);
  const dTime = dropoffTimeOf(b);

  const lines = [
    `New rental booking on vintageridesusa.com${tag}`,
    ``,
    `Booking:    ${b.bookingId}`,
    `Status:     ${b.livemode ? "LIVE — payment captured" : "TEST mode (no real payment)"}`,
    ``,
    `Customer:   ${fullName}`,
    `Email:      ${b.email}`,
    `Phone:      ${b.phone || "(not provided)"}`,
    ``,
    `Pickup:     ${fmtDate(b.startDate)} (${pTime})`,
    `Return:     ${fmtDate(b.endDate)} (${dTime})`,
    `Duration:   ${b.totalDays} ${b.totalDays === 1 ? "day" : "days"}`,
    `Bikes:      ${b.bikeCount} ${b.bikeCount === 1 ? "bike" : "bikes"}`,
    `Total paid: ${fmtMoney(b.totalPrice)}`,
    ``,
    `Confirmation email already sent to the customer.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a28;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e0;">
    <tr><td style="background:#111110;padding:20px 24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a45a;">New booking${tag}</div>
      <div style="color:#ffffff;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-top:6px;">VINTAGE RIDES <span style="color:#c8a45a;font-weight:400;">USA</span></div>
    </td></tr>
    <tr><td style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.6;color:#2a2a28;">
        <tr><td style="padding:6px 0;color:#8a8a86;width:140px;">Booking</td><td style="font-family:'SF Mono',Menlo,Consolas,monospace;color:#111110;">${escapeHtml(b.bookingId)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Status</td><td style="color:${b.livemode ? "#111110" : "#b34b00"};font-weight:${b.livemode ? "400" : "600"};">${b.livemode ? "LIVE — payment captured" : "TEST mode (no real payment)"}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid #e8e6e0;"></div></td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Customer</td><td style="color:#111110;font-weight:600;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Email</td><td><a href="mailto:${escapeHtml(b.email)}" style="color:#c8a45a;text-decoration:none;">${escapeHtml(b.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Phone</td><td>${b.phone ? `<a href="tel:${escapeHtml(b.phone)}" style="color:#c8a45a;text-decoration:none;">${escapeHtml(b.phone)}</a>` : '<span style="color:#8a8a86;">(not provided)</span>'}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid #e8e6e0;"></div></td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Pickup</td><td style="color:#111110;">${fmtDate(b.startDate)} · ${escapeHtml(pTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Return</td><td style="color:#111110;">${fmtDate(b.endDate)} · ${escapeHtml(dTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Duration</td><td style="color:#111110;">${b.totalDays} ${b.totalDays === 1 ? "day" : "days"}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Bikes</td><td style="color:#111110;">${b.bikeCount} ${b.bikeCount === 1 ? "bike" : "bikes"}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8a86;">Total paid</td><td style="color:#111110;font-weight:600;">${fmtMoney(b.totalPrice)}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#8a8a86;">Confirmation email already sent to the customer.</p>
    </td></tr>
  </table>
</body></html>`;

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      replyTo: { email: b.email, name: fullName },
      to: INTERNAL_RECIPIENTS,
      subject,
      htmlContent: html,
      textContent: lines,
      tags: ["booking-internal-notification", "vintage-rides-usa", b.livemode ? "live" : "test"],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo internal notification failed ${res.status}: ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
