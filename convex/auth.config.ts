export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://in-yak-83.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
