/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
  // Browsers only honour this over HTTPS, so it does nothing on localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// The pages used to have Romanian URLs. Links in emails already sent still point there.
const oldPaths = [
  ["/conectare", "/sign-in"],
  ["/inregistrare", "/sign-up"],
  ["/verificare", "/verify-email"],
  ["/profil", "/profile"],
  ["/harta", "/map"],
  ["/panou", "/dashboard"],
  ["/invitatie", "/invite"],
  ["/resetare", "/reset-password"],
  ["/cont/parola", "/account/password"],
  ["/cont", "/account"],
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return oldPaths.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
