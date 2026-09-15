import { useState } from 'react';

// campo de senha com botao "Mostrar" - o estado de visibilidade vive aqui
// dentro, ja que so este componente precisa saber dele (quem usa o campo
// so se importa com o valor digitado)
export function PasswordField({ id, label, value, onChange, minLength, autoComplete }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-field">
      <div className="auth-field-head">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="toggle-visibility" onClick={() => setIsVisible((v) => !v)}>
          {isVisible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        minLength={minLength}
        autoComplete={autoComplete}
        required
      />
    </div>
  );
}
