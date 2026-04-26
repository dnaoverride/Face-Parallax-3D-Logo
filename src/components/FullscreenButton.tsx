type Props = {
  onClick: () => void;
  fullscreen: boolean;
};

export function FullscreenButton({ onClick, fullscreen }: Props) {
  return (
    <button type="button" className="btn-ghost top-right" onClick={onClick}>
      {fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    </button>
  );
}
