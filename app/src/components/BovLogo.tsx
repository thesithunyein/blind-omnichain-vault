interface Props {
  size?: number;
  className?: string;
  label?: string;
}

export function BovLogo({ size = 32, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BOV Logo"
    >
      {/* Outer orbital ring */}
      <circle
        cx="20"
        cy="20"
        r="18.5"
        stroke="rgba(34,197,94,0.25)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Main vault circle */}
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="rgba(34,197,94,0.06)"
        stroke="rgba(34,197,94,0.7)"
        strokeWidth="1.25"
      />

      {/* Vault bolt marks */}
      <circle cx="20" cy="7.5" r="1.2" fill="rgba(34,197,94,0.5)" />
      <circle cx="20" cy="32.5" r="1.2" fill="rgba(34,197,94,0.5)" />
      <circle cx="7.5" cy="20" r="1.2" fill="rgba(34,197,94,0.5)" />
      <circle cx="32.5" cy="20" r="1.2" fill="rgba(34,197,94,0.5)" />

      {/* Lock shackle */}
      <path
        d="M15.5 17.5V15.5C15.5 12.738 17.238 11 20 11C22.762 11 24.5 12.738 24.5 15.5V17.5"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lock body */}
      <rect
        x="13.5"
        y="17.5"
        width="13"
        height="10"
        rx="2.5"
        fill="rgba(34,197,94,0.12)"
        stroke="#22c55e"
        strokeWidth="1.25"
      />

      {/* Keyhole circle */}
      <circle cx="20" cy="21.5" r="1.75" fill="#22c55e" />

      {/* Keyhole stem */}
      <path
        d="M20 23.25V25.5"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
