import "server-only";

import { COUPLE, VENUE, WEDDING_DATE } from "@/shared/config";

interface RsvpEmailSubmission {
  guestNames: string[];
  attending: "yes" | "no";
  guests: number;
  dietary: string | null;
  message: string | null;
  submittedAt: Date;
}

interface RsvpNotificationEmailProps {
  submission: RsvpEmailSubmission;
}

type EmailThemeTokens = {
  background: string;
  shell: string;
  hero: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  successBg: string;
  successText: string;
  regretBg: string;
  regretText: string;
};

const EMAIL_THEME = {
  light: {
    background: "#FAF6F0",
    shell: "#FFF8F1",
    hero: "#F0EAD6",
    surface: "#FFFCF7",
    accent: "#A8845A",
    textPrimary: "#2C2825",
    textSecondary: "#857D71",
    border: "#E3D7C8",
    successBg: "#E9F1E6",
    successText: "#35503B",
    regretBg: "#F6E6E0",
    regretText: "#6C4234",
  },
  dark: {
    background: "#1A1614",
    shell: "#241F1C",
    hero: "#3D352C",
    surface: "#2B2522",
    accent: "#BF9570",
    textPrimary: "#F5EDE6",
    textSecondary: "#A99E94",
    border: "#4B4138",
    successBg: "#2B3B2E",
    successText: "#DCE8DD",
    regretBg: "#472F28",
    regretText: "#F2DBD2",
  },
} as const satisfies Record<"light" | "dark", EmailThemeTokens>;

function scopeSelector(scope: string, selector: string) {
  return scope ? `${scope} ${selector}` : selector;
}

function buildThemeCss(scope: string, theme: EmailThemeTokens) {
  return `
    ${scopeSelector(scope, ".email-body")},
    ${scopeSelector(scope, ".email-wrapper")} {
      background-color: ${theme.background} !important;
      color: ${theme.textPrimary} !important;
    }

    ${scopeSelector(scope, ".email-shell")} {
      background-color: ${theme.shell} !important;
      border-color: ${theme.border} !important;
    }

    ${scopeSelector(scope, ".email-hero")} {
      background-color: ${theme.hero} !important;
      border-bottom: 1px solid ${theme.border} !important;
    }

    ${scopeSelector(scope, ".email-card")} {
      background-color: ${theme.surface} !important;
      border-color: ${theme.border} !important;
    }

    ${scopeSelector(scope, ".email-title")},
    ${scopeSelector(scope, ".email-heading")},
    ${scopeSelector(scope, ".email-text-primary")},
    ${scopeSelector(scope, ".email-detail-value")},
    ${scopeSelector(scope, ".email-guest-name")} {
      color: ${theme.textPrimary} !important;
    }

    ${scopeSelector(scope, ".email-label")},
    ${scopeSelector(scope, ".email-copy")},
    ${scopeSelector(scope, ".email-detail-label")},
    ${scopeSelector(scope, ".email-footnote")},
    ${scopeSelector(scope, ".email-index")} {
      color: ${theme.textSecondary} !important;
    }

    ${scopeSelector(scope, ".email-link")} {
      color: ${theme.accent} !important;
    }

    ${scopeSelector(scope, ".email-divider")} {
      border-top-color: ${theme.border} !important;
    }

    ${scopeSelector(scope, ".email-badge-yes")} {
      background-color: ${theme.successBg} !important;
      color: ${theme.successText} !important;
    }

    ${scopeSelector(scope, ".email-badge-no")} {
      background-color: ${theme.regretBg} !important;
      color: ${theme.regretText} !important;
    }
  `;
}

const EMAIL_STYLES = `
  :root {
    color-scheme: light dark;
    supported-color-schemes: light dark;
  }

  body {
    margin: 0;
    padding: 0;
  }

  .email-preheader {
    display: none !important;
    overflow: hidden !important;
    line-height: 1px !important;
    opacity: 0 !important;
    max-height: 0 !important;
    max-width: 0 !important;
  }

  ${buildThemeCss("", EMAIL_THEME.light)}

  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }

    ${buildThemeCss("", EMAIL_THEME.dark)}
  }

  ${buildThemeCss("[data-ogsc]", EMAIL_THEME.dark)}
  ${buildThemeCss("[data-ogsb]", EMAIL_THEME.dark)}
`;

const coupleNames = `${COUPLE.groom.name.en} & ${COUPLE.bride.name.en}`;
const weddingDateLabel = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Oslo",
}).format(WEDDING_DATE);

const submittedAtFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Oslo",
});

function getAttendanceLabel(attending: RsvpEmailSubmission["attending"]) {
  return attending === "yes" ? "Буде присутній" : "Не зможе бути";
}

function getAttendanceDescription(submission: RsvpEmailSubmission) {
  if (submission.attending === "yes") {
    return `Підтвердив(ла) присутність для ${submission.guests} ${submission.guests === 1 ? "гостя" : "гостей"}.`;
  }

  return "Делікатно повідомив(ла), що не зможе бути присутнім(ою).";
}

function getPrimaryGuestName(submission: RsvpEmailSubmission) {
  return submission.guestNames[0] ?? "Гість";
}

function formatGuestSummary(submission: RsvpEmailSubmission) {
  const primaryGuestName = getPrimaryGuestName(submission);
  const additionalGuestsCount = submission.guestNames.length - 1;

  if (additionalGuestsCount <= 0) {
    return primaryGuestName;
  }

  return `${primaryGuestName} +${additionalGuestsCount}`;
}

function formatGuestNames(submission: RsvpEmailSubmission) {
  return submission.guestNames
    .map((name, index) => `${index + 1}. ${name}`)
    .join("\n");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        className="email-detail-label"
        style={{
          padding: "0 0 8px",
          verticalAlign: "top",
          width: "168px",
          fontSize: "12px",
          lineHeight: "18px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: EMAIL_THEME.light.textSecondary,
        }}
      >
        {label}
      </td>
      <td
        className="email-detail-value"
        style={{
          padding: "0 0 8px",
          fontSize: "15px",
          lineHeight: "24px",
          color: EMAIL_THEME.light.textPrimary,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function MessageCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <table
      className="email-card"
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        marginTop: "18px",
        borderRadius: "22px",
        backgroundColor: EMAIL_THEME.light.surface,
        border: `1px solid ${EMAIL_THEME.light.border}`,
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "20px 22px" }}>
            <p
              className="email-detail-label"
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                lineHeight: "18px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: EMAIL_THEME.light.textSecondary,
              }}
            >
              {label}
            </p>
            <p
              className="email-text-primary"
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: "26px",
                color: EMAIL_THEME.light.textPrimary,
                whiteSpace: "pre-wrap",
              }}
            >
              {value}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function GuestListCard({ names }: { names: string[] }) {
  return (
    <table
      className="email-card"
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        marginTop: "18px",
        borderRadius: "22px",
        backgroundColor: EMAIL_THEME.light.surface,
        border: `1px solid ${EMAIL_THEME.light.border}`,
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "20px 22px" }}>
            <p
              className="email-detail-label"
              style={{
                margin: "0 0 14px",
                fontSize: "12px",
                lineHeight: "18px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: EMAIL_THEME.light.textSecondary,
              }}
            >
              Список гостей
            </p>
            <table
              role="presentation"
              width="100%"
              cellPadding="0"
              cellSpacing="0"
            >
              <tbody>
                {names.map((name, index) => (
                  <tr key={`${name}-${index}`}>
                    <td
                      className="email-index"
                      style={{
                        padding: "0 0 10px",
                        width: "32px",
                        fontSize: "13px",
                        lineHeight: "20px",
                        color: EMAIL_THEME.light.textSecondary,
                      }}
                    >
                      {index + 1}.
                    </td>
                    <td
                      className="email-guest-name"
                      style={{
                        padding: "0 0 10px",
                        fontSize: "15px",
                        lineHeight: "24px",
                        color: EMAIL_THEME.light.textPrimary,
                      }}
                    >
                      {name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function buildRsvpEmailSubject(
  submission: RsvpEmailSubmission,
  subjectPrefix: string
) {
  return `${subjectPrefix} • ${getAttendanceLabel(submission.attending)} • ${formatGuestSummary(submission)}`;
}

export function buildRsvpEmailText(submission: RsvpEmailSubmission) {
  const lines = [
    `${coupleNames} — нова RSVP відповідь`,
    "",
    `Статус: ${getAttendanceLabel(submission.attending)}`,
    `Гості:`,
    formatGuestNames(submission),
    submission.attending === "yes"
      ? `Кількість гостей: ${submission.guests}`
      : "Кількість гостей: не застосовується",
    `Дієтичні побажання: ${submission.dietary ?? "Не вказано"}`,
    `Повідомлення: ${submission.message ?? "Не залишив(ла)"}`,
    `Надіслано: ${submittedAtFormatter.format(submission.submittedAt)}`,
    "",
    `Весілля: ${weddingDateLabel}`,
    `Локація: ${VENUE.name}, ${VENUE.address}`,
  ];

  return lines.join("\n");
}

export function RsvpNotificationEmail({
  submission,
}: RsvpNotificationEmailProps) {
  const badgeStyles =
    submission.attending === "yes"
      ? {
          backgroundColor: EMAIL_THEME.light.successBg,
          color: EMAIL_THEME.light.successText,
        }
      : {
          backgroundColor: EMAIL_THEME.light.regretBg,
          color: EMAIL_THEME.light.regretText,
        };
  const badgeClassName =
    submission.attending === "yes"
      ? "email-badge email-badge-yes"
      : "email-badge email-badge-no";

  return (
    <html lang="uk">
      <head>
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <meta content="light dark" name="color-scheme" />
        <meta content="light dark" name="supported-color-schemes" />
        <style>{EMAIL_STYLES}</style>
      </head>
      <body
        className="email-body"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: EMAIL_THEME.light.background,
          color: EMAIL_THEME.light.textPrimary,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          className="email-preheader"
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {formatGuestSummary(submission)} надіслав(ла) нову RSVP відповідь.
        </div>

        <table
          className="email-wrapper"
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: EMAIL_THEME.light.background }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  className="email-shell"
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: "680px",
                    backgroundColor: EMAIL_THEME.light.shell,
                    borderRadius: "32px",
                    overflow: "hidden",
                    border: `1px solid ${EMAIL_THEME.light.border}`,
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        className="email-hero"
                        style={{
                          padding: "40px 40px 30px",
                          backgroundColor: EMAIL_THEME.light.hero,
                          borderBottom: `1px solid ${EMAIL_THEME.light.border}`,
                        }}
                      >
                        <p
                          className="email-label"
                          style={{
                            margin: "0 0 12px",
                            fontSize: "12px",
                            lineHeight: "18px",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: EMAIL_THEME.light.textSecondary,
                          }}
                        >
                          Wedding RSVP Notification
                        </p>
                        <h1
                          className="email-title"
                          style={{
                            margin: "0 0 10px",
                            fontFamily:
                              "Georgia, Cambria, 'Times New Roman', serif",
                            fontSize: "38px",
                            lineHeight: "44px",
                            fontWeight: 600,
                            color: EMAIL_THEME.light.textPrimary,
                          }}
                        >
                          {coupleNames}
                        </h1>
                        <p
                          className="email-copy"
                          style={{
                            margin: "0 0 22px",
                            fontSize: "15px",
                            lineHeight: "24px",
                            color: EMAIL_THEME.light.textSecondary,
                          }}
                        >
                          {weddingDateLabel}
                          <br />
                          {VENUE.name}, Bergen
                        </p>
                        <span
                          className={badgeClassName}
                          style={{
                            display: "inline-block",
                            padding: "9px 16px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            lineHeight: "18px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            ...badgeStyles,
                          }}
                        >
                          {getAttendanceLabel(submission.attending)}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "32px 40px 12px" }}>
                        <h2
                          className="email-heading"
                          style={{
                            margin: "0 0 8px",
                            fontFamily:
                              "Georgia, Cambria, 'Times New Roman', serif",
                            fontSize: "28px",
                            lineHeight: "34px",
                            fontWeight: 600,
                            color: EMAIL_THEME.light.textPrimary,
                          }}
                        >
                          Нова відповідь від {getPrimaryGuestName(submission)}
                        </h2>
                        <p
                          className="email-copy"
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            lineHeight: "25px",
                            color: EMAIL_THEME.light.textSecondary,
                          }}
                        >
                          {getAttendanceDescription(submission)}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "0 40px 8px" }}>
                        <table
                          className="email-card"
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{
                            borderRadius: "24px",
                            backgroundColor: EMAIL_THEME.light.surface,
                            border: `1px solid ${EMAIL_THEME.light.border}`,
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: "24px 24px 16px" }}>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                >
                                  <tbody>
                                    <DetailRow
                                      label="Статус"
                                      value={getAttendanceLabel(submission.attending)}
                                    />
                                    <DetailRow
                                      label="Кількість гостей"
                                      value={
                                        submission.attending === "yes"
                                          ? String(submission.guests)
                                          : "Не застосовується"
                                      }
                                    />
                                    <DetailRow
                                      label="Надіслано"
                                      value={submittedAtFormatter.format(submission.submittedAt)}
                                    />
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <GuestListCard names={submission.guestNames} />

                        <MessageCard
                          label="Дієтичні побажання"
                          value={submission.dietary ?? "Не вказано"}
                        />

                        <MessageCard
                          label="Побажання парі"
                          value={submission.message ?? "Не залишив(ла) повідомлення"}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "20px 40px 40px" }}>
                        <table
                          className="email-divider"
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{
                            borderTop: `1px solid ${EMAIL_THEME.light.border}`,
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ paddingTop: "20px" }}>
                                <p
                                  className="email-footnote"
                                  style={{
                                    margin: "0 0 6px",
                                    fontSize: "13px",
                                    lineHeight: "20px",
                                    color: EMAIL_THEME.light.textSecondary,
                                  }}
                                >
                                  Це повідомлення надійшло з RSVP форми нашого весільного сайту.
                                </p>
                                <p
                                  className="email-footnote"
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    lineHeight: "20px",
                                    color: EMAIL_THEME.light.textSecondary,
                                  }}
                                >
                                  <a
                                    className="email-link"
                                    href="https://diandmax.com"
                                    style={{
                                      color: EMAIL_THEME.light.accent,
                                      textDecoration: "none",
                                    }}
                                  >
                                    diandmax.com
                                  </a>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
