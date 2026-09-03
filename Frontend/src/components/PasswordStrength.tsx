import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { label: 'Una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { label: 'Un número', test: (v) => /[0-9]/.test(v) },
  { label: 'Un carácter especial', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function getPasswordScore(value: string): number {
  return passwordRules.filter((rule) => rule.test(value)).length;
}

export function isPasswordSecure(value: string): boolean {
  return getPasswordScore(value) === passwordRules.length;
}

interface PasswordStrengthProps {
  value: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ value }) => {
  const score = getPasswordScore(value);
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
  const label = value.length === 0 ? '' : labels[score];

  if (value.length === 0) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bar">
        {passwordRules.map((_, i) => (
          <span key={i} className={`password-strength-seg ${i < score ? `level-${score}` : ''}`} />
        ))}
      </div>
      {label && <p className={`password-strength-label level-${score}`}>{label}</p>}
      <ul className="password-rules">
        {passwordRules.map((rule) => {
          const passed = rule.test(value);
          return (
            <li key={rule.label} className={passed ? 'passed' : ''}>
              {passed ? <Check size={13} /> : <X size={13} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
