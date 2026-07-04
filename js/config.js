/* ============================================================
   THE HAIR WITCH — site configuration
   Edit this file only; no other code changes needed.
   Shared by the production site AND all three design options.
   ============================================================ */

window.HW_CONFIG = {
  // Live Square Appointments booking — the EXACT flow her current site
  // (hairwitchery.site123.me) and Instagram bio point to. Same merchant
  // (wnldzv2a05sx0o) + location (LCA4TGQ6Z7CYZ), so nothing about her
  // Square system changes: clients, history, reminders all stay intact.
  squareBookingUrl: "https://book.squareup.com/appointments/wnldzv2a05sx0o/location/LCA4TGQ6Z7CYZ",

  // ---- Contact / messages ----
  // Create a free form at https://formspree.io (or https://web3forms.com),
  // paste the endpoint URL here. Messages land in Theresa's inbox AND
  // the same submissions feed the subscriber list (see marketing doc).
  // Until configured, forms fall back to opening an email draft.
  formEndpoint: "",

  // ---- Newsletter ("Join the Coven") ----
  // MailerLite (recommended, free to 1,000 subscribers with automation):
  // create a form, paste its action URL here. Empty = same email fallback.
  newsletterEndpoint: "",

  // ---- Stripe Payment Links ----
  // Create in Stripe Dashboard > Payment Links, paste URLs.
  // Empty string = that button stays hidden. docs/stripe-booking-setup.md
  stripeLinks: {
    // Deposits ($60-$75) are NOT self-serve: after a booking is made,
    // Theresa personally texts/emails the client this payment link.
    // Create ONE Stripe Payment Link for it and keep it handy in her phone;
    // it does not need to be wired to any button on the site.
    colorDeposit: "",
    // Gift cards are arranged personally (text/email Theresa) - no site checkout.

    // The ebook (digital). For file delivery use Payhip/Gumroad link instead —
    // both auto-deliver the PDF after checkout. See marketing strategy doc.
    ebook: "",

    // Original artworks — one link per piece (or leave empty to use Inquire)
    art01: "", art02: "", art03: "", art04: "", art05: "", art06: "", art07: ""
  },

  // Ebook display info (PLACEHOLDER — confirm title & price with Theresa)
  ebook: {
    title: "The Hair Witch Grimoire",
    subtitle: "Rituals, color alchemy & everyday hair magick",
    price: "$14",
    available: true
  }
};
