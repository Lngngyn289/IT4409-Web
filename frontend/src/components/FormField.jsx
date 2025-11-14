function FormField({
  label,
  optional = false,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
  options,
}) {
  const id = `field-${name}`;

  if (type === "select") {
    return (
      <label htmlFor={id} className="block text-sm">
        <span className="mb-1 inline-flex items-center gap-2 text-slate-300">
          {label}
          {optional && <span className="text-xs text-slate-500">(không bắt buộc)</span>}
        </span>
        <div className="relative rounded-2xl border border-white/10 bg-slate-900/50">
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full rounded-2xl bg-transparent px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900 text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </label>
    );
  }

  return (
    <label htmlFor={id} className="block text-sm">
      <span className="mb-1 inline-flex items-center gap-2 text-slate-300">
        {label}
        {optional && <span className="text-xs text-slate-500">(không bắt buộc)</span>}
      </span>
      <div className="relative rounded-2xl border border-white/10 bg-slate-950/30 focus-within:border-indigo-400/80">
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none"
          required={!optional}
        />
      </div>
    </label>
  );
}

export default FormField;
