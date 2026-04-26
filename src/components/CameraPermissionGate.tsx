type Props = {
  message: string | null;
};

/** Status strip for camera / tracking fallbacks. */
export function CameraPermissionGate({ message }: Props) {
  if (!message) return null;
  return (
    <div className="status-banner" role="status">
      {message}
    </div>
  );
}
