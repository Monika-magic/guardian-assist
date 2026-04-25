import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-danger">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Signal lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route is off the network.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Return to safety
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "SASN — Smart Adaptive Safety Network" },
      { name: "description", content: "Real-time emergency response prototype with SOS, live tracking, and AI distress detection." },
      { name: "theme-color", content: "#1a1320" },
      { property: "og:title", content: "SASN — Smart Adaptive Safety Network" },
      { name: "twitter:title", content: "SASN — Smart Adaptive Safety Network" },
      { property: "og:description", content: "Real-time emergency response prototype with SOS, live tracking, and AI distress detection." },
      { name: "twitter:description", content: "Real-time emergency response prototype with SOS, live tracking, and AI distress detection." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ea618404-a9a6-4237-8cd7-d20a74e24d3b/id-preview-e424eba9--bb2ecdc3-6a12-474c-bc79-90b1dc60ec01.lovable.app-1777111290602.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ea618404-a9a6-4237-8cd7-d20a74e24d3b/id-preview-e424eba9--bb2ecdc3-6a12-474c-bc79-90b1dc60ec01.lovable.app-1777111290602.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <AppShell />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
