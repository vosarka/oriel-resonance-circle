export function installAnalytics() {
  if (typeof document === "undefined") return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${String(endpoint).replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = String(websiteId);

  document.body.appendChild(script);
}
