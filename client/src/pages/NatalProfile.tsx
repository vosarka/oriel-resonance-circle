import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  gold: "#bda36b",
  amber: "#f6b05e",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
  green: "#44a866",
};

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "rgba(20,20,28,0.72)",
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.035)",
        color: C.txt,
        fontFamily: "var(--font-ritual)",
        fontSize: 12,
        padding: "11px 12px",
        outline: "none",
        colorScheme: "dark",
      }}
    />
  );
}

export default function NatalProfile() {
  const { user, loading, isAuthenticated, refresh } = useAuth();
  const [, setLocation] = useLocation();

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthCountry, setBirthCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolveQuery = useMemo(() => {
    const city = birthCity.trim();
    const country = birthCountry.trim();
    if (!city || !country) return "";
    return `${city}, ${country}`;
  }, [birthCity, birthCountry]);

  const statusQuery = trpc.profile.getNatalCompletionStatus.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const geocodeQuery = trpc.geo.geocode.useQuery(
    { city: resolveQuery },
    { enabled: resolveQuery.length > 0 }
  );

  const completeMutation = trpc.profile.completeNatalProfile.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (statusQuery.data?.complete) {
      setLocation("/blueprint");
    }
  }, [setLocation, statusQuery.data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!birthDate || !birthTime || !birthCity.trim() || !birthCountry.trim()) {
      setError("Complete all natal fields before calculating.");
      return;
    }

    const geocodeResult =
      geocodeQuery.data ?? (await geocodeQuery.refetch()).data;
    if (!geocodeResult) {
      setError(
        "We could not resolve the location. Check the city and country."
      );
      return;
    }

    try {
      await completeMutation.mutateAsync({
        birthDate,
        birthTime,
        birthCity: birthCity.trim(),
        birthCountry: birthCountry.trim(),
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        timezoneId: geocodeResult.tzId,
        timezoneOffset: geocodeResult.offsetHours,
      });
      await refresh();
      setSuccess("Your Static Signature has been calculated and saved.");
      window.location.href = "/blueprint";
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Natal profile calculation failed."
      );
    }
  };

  if (loading || statusQuery.isLoading) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Spinner style={{ width: 56, height: 56 }} />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 10,
              color: C.txtD,
              letterSpacing: "0.2em",
            }}
          >
            INITIALIZING NATAL PROFILE…
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="cinematic-page" style={{ minHeight: "100vh" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                color: C.amber,
                letterSpacing: "0.25em",
                marginBottom: 12,
              }}
            >
              NATAL ONBOARDING
            </div>
            <div
              style={{
                width: 32,
                height: 1,
                background: `linear-gradient(90deg, ${C.gold}, transparent)`,
                marginBottom: 20,
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 42px)",
                color: C.txt,
                fontWeight: 300,
                marginBottom: 8,
              }}
            >
              Complete your Static Signature
            </h1>
            <p
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 11,
                color: C.txtS,
                lineHeight: 1.9,
                maxWidth: 560,
              }}
            >
              Static Signature is no longer a separate reading. ORIEL now uses a
              canonical, persistent natal profile to contextualize all dynamic
              readings and Static Signature interactions.
            </p>
          </div>

          <div
            className="cinematic-card"
            style={{
              background: "rgba(20,20,28,0.72)",
              border: `1px solid ${C.border}`,
              padding: "28px 24px",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtD,
                      letterSpacing: "0.15em",
                      marginBottom: 6,
                    }}
                  >
                    DATE OF BIRTH
                  </div>
                  <InputField
                    type="date"
                    value={birthDate}
                    onChange={event => setBirthDate(event.target.value)}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtD,
                      letterSpacing: "0.15em",
                      marginBottom: 6,
                    }}
                  >
                    TIME OF BIRTH
                  </div>
                  <InputField
                    type="time"
                    value={birthTime}
                    onChange={event => setBirthTime(event.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtD,
                      letterSpacing: "0.15em",
                      marginBottom: 6,
                    }}
                  >
                    BIRTH CITY
                  </div>
                  <InputField
                    type="text"
                    value={birthCity}
                    onChange={event => setBirthCity(event.target.value)}
                    placeholder="Bucharest"
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtD,
                      letterSpacing: "0.15em",
                      marginBottom: 6,
                    }}
                  >
                    BIRTH COUNTRY
                  </div>
                  <InputField
                    type="text"
                    value={birthCountry}
                    onChange={event => setBirthCountry(event.target.value)}
                    placeholder="Romania"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                  color: geocodeQuery.data ? C.green : C.txtD,
                }}
              >
                <MapPin size={14} />
                <div
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                  }}
                >
                  {geocodeQuery.isFetching
                    ? "RESOLVING LOCATION..."
                    : geocodeQuery.data
                      ? `${geocodeQuery.data.displayName} · ${geocodeQuery.data.latitude.toFixed(4)}, ${geocodeQuery.data.longitude.toFixed(4)} · ${geocodeQuery.data.tzId}`
                      : "LOCATION WILL RESOLVE AUTOMATICALLY WHEN CITY AND COUNTRY ARE COMPLETE"}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: 16,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: C.red,
                    lineHeight: 1.8,
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    marginBottom: 16,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: C.green,
                    lineHeight: 1.8,
                  }}
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={completeMutation.isPending}
                className="dew-drop retina-border"
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: "rgba(246,176,94,0.12)",
                  color: C.amber,
                  border: `1px solid ${C.amber}`,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  cursor: completeMutation.isPending ? "wait" : "pointer",
                  opacity: completeMutation.isPending ? 0.7 : 1,
                }}
              >
                {completeMutation.isPending
                  ? "CALCULATING STATIC SIGNATURE..."
                  : "SAVE STATIC SIGNATURE"}
              </button>
            </form>
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </Layout>
  );
}
