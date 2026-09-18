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

// onnxruntime-web (plate detection) ships every backend it supports — webgl, webgpu, a
// native Node binding, several WASM feature variants — in one package, and Next's file
// tracer bundles the lot with any route that touches it: ~136MB for one dependency. Only
// the plain, single-threaded WASM backend is ever used here (see plate-blur.ts), confirmed
// by literally removing everything else from node_modules and re-running real detection
// against it. These patterns exclude the other ~120MB that was proven unreachable.
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return oldPaths.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/onnxruntime-web/dist/ort.js",
      "./node_modules/onnxruntime-web/dist/ort.mjs",
      "./node_modules/onnxruntime-web/dist/ort.min.*",
      "./node_modules/onnxruntime-web/dist/ort.bundle.min.mjs",
      "./node_modules/onnxruntime-web/dist/ort.all.*",
      "./node_modules/onnxruntime-web/dist/ort.node.*",
      "./node_modules/onnxruntime-web/dist/ort.webgl.*",
      "./node_modules/onnxruntime-web/dist/ort.webgpu.*",
      "./node_modules/onnxruntime-web/dist/ort.jspi.*",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.*",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jspi.*",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.*",
    ],
  },
};

export default nextConfig;
