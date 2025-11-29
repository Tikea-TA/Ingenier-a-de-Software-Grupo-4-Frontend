import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export const Alert = ({
  type = "error",
  title = "",
  message = "",
  onClose = null,
  className = "",
}) => {
  const baseStyles =
    "rounded-lg border p-4 flex gap-3 items-start";

  const typeStyles = {
    error: "border-red-900/50 bg-red-950/20",
    success: "border-green-900/50 bg-green-950/20",
    warning: "border-amber-900/50 bg-amber-950/20",
    info: "border-blue-900/50 bg-blue-950/20",
  };

  const iconColors = {
    error: "text-red-400",
    success: "text-green-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };

  const textColors = {
    error: "text-red-400",
    success: "text-green-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };

  const icons = {
    error: <AlertCircle className={`h-5 w-5 ${iconColors.error} shrink-0 mt-0.5`} />,
    success: <CheckCircle2 className={`h-5 w-5 ${iconColors.success} shrink-0 mt-0.5`} />,
    warning: <AlertCircle className={`h-5 w-5 ${iconColors.warning} shrink-0 mt-0.5`} />,
    info: <Info className={`h-5 w-5 ${iconColors.info} shrink-0 mt-0.5`} />,
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${textColors[type]} mb-1`}>
            {title}
          </h3>
        )}
        {message && (
          <p className={`text-sm ${textColors[type]}`}>
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-xl font-bold ${textColors[type]} hover:opacity-70`}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
