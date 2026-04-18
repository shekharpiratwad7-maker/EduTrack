import { cn } from './utils'

function Spinner({
  className,
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      className={cn(
        'animate-spin',
        className,
      )}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 11C21.55 11 22 11.45 22 12C22 12.55 21.55 13 21 13C20.45 13 20 12.55 20 12C20 11.45 20.45 11 21 11ZM12 20C10.9 20 10 19.1 10 18C10 16.9 10.9 16 12 16C13.1 16 14 16.9 14 18C14 19.1 13.1 20 12 20ZM3 12C3 11.45 3.45 11 4 11C4.55 11 5 11.45 5 12C5 12.55 4.55 13 4 13C3.45 13 3 12.55 3 12ZM12 2V6C13.1 6 14 2.9 14 4C14 5.1 13.1 6 12 6ZM21 11V13C21.55 13 22 11.45 22 12C22 12.55 21.55 13 21 13ZM12 18V20C10.9 20 10 19.1 10 18C10 16.9 10.9 16 12 16ZM3 11V13C3.45 11 4 11.45 4 12C4.55 12 5 12.55 5 13C5 13.55 4.55 13 4 13C3.45 13 3 12.55 3 12Z"
        fill="currentColor"
      />
    </svg>
  )
}

Spinner.displayName = "Spinner"

export { Spinner }
