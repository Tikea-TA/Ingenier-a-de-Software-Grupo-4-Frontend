import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
export const LoginLabel = ({
  type,
  name,
  label,
  placeholder,
  required = false,
  onChange,
  value,
}) => {
  const [show, setShow] = useState(false);
  return type === "password" ? (
    <label className="text-sm">
      <span className="mb-2 block text-text">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder="************"
          name="password"
          className="w-full rounded-xl px-4 py-3 mb-1 text-base placeholder:text-muted ring-1 focus:outline-none focus:ring-2"
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted hover:text-text focus:outline-none focus:ring-2"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  ) : (
    <label className="text-sm">
      <span className="mb-2 block text-text">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        label={label}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 mb-1 py-3 text-base placeholder:text-muted ring-1 focus:outline-none focus:ring-2"
        onChange={onChange}
      />
    </label>
  );
};
