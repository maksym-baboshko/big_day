import { cn } from "@/shared/lib";

type RsvpFieldGroupTag = "fieldset" | "div";
type RsvpFieldGroupTitleTag = "legend" | "label" | "p";

interface RsvpFieldGroupProps {
  children: React.ReactNode;
  title: React.ReactNode;
  as?: RsvpFieldGroupTag;
  titleAs?: RsvpFieldGroupTitleTag;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  hintId?: string;
  error?: React.ReactNode;
  errorId?: string;
  errorRole?: "alert" | "status";
  describedBy?: string;
  invalid?: boolean;
  className?: string;
  titleClassName?: string;
}

const BASE_TITLE_CLASS =
  "mb-3 block w-full text-xs font-medium uppercase tracking-[0.18em] text-text-secondary/90";

function renderTitle({
  title,
  titleAs,
  htmlFor,
  required,
  className,
}: {
  title: React.ReactNode;
  titleAs: RsvpFieldGroupTitleTag;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {title}
      {required ? <span className="ml-1 text-accent">*</span> : null}
    </>
  );

  if (titleAs === "label") {
    return (
      <label htmlFor={htmlFor} className={cn(BASE_TITLE_CLASS, className)}>
        {content}
      </label>
    );
  }

  if (titleAs === "legend") {
    return <legend className={cn(BASE_TITLE_CLASS, className)}>{content}</legend>;
  }

  return <p className={cn(BASE_TITLE_CLASS, className)}>{content}</p>;
}

function ErrorText({
  children,
  id,
  role,
}: {
  children: React.ReactNode;
  id?: string;
  role?: "alert" | "status";
}) {
  return (
    <p
      id={id}
      role={role}
      aria-live={role === "alert" ? "assertive" : undefined}
      aria-atomic={role ? "true" : undefined}
      className="mt-2 text-[10px] uppercase tracking-[0.15em] text-error/85"
    >
      {children}
    </p>
  );
}

export function RsvpFieldGroup({
  children,
  title,
  as = "div",
  titleAs = as === "fieldset" ? "legend" : "p",
  htmlFor,
  required,
  hint,
  hintId,
  error,
  errorId,
  errorRole,
  describedBy,
  invalid,
  className,
  titleClassName,
}: RsvpFieldGroupProps) {
  const resolvedDescribedBy = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  const body = (
    <>
      {renderTitle({ title, titleAs, htmlFor, required, className: titleClassName })}
      {children}
      {hint ? (
        <p
          id={hintId}
          className="mt-3 text-[10px] uppercase tracking-[0.13em] text-text-secondary/90"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <ErrorText id={errorId} role={errorRole}>
          {error}
        </ErrorText>
      ) : null}
    </>
  );

  if (as === "fieldset") {
    return (
      <fieldset
        className={cn("min-w-0 border-0 p-0", className)}
        aria-describedby={resolvedDescribedBy}
        aria-invalid={invalid ? "true" : undefined}
      >
        {body}
      </fieldset>
    );
  }

  return <div className={className}>{body}</div>;
}
