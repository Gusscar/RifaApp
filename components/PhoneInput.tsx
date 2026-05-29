'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia',   placeholder: '3001234567',  digits: 10 },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela',  placeholder: '4121234567',  digits: 10 },
]

type Country = typeof COUNTRIES[number]

interface PhoneInputProps {
  value: string                      // full number with country code, e.g. "+573001234567"
  onChange: (full: string) => void   // called with "+57XXXXXXXXXX"
  id?: string
  required?: boolean
  className?: string
}

/** Parse a full phone string into {country, local} */
function parse(full: string): { country: Country; local: string } {
  const country = COUNTRIES.find(c => full.startsWith(c.code)) ?? COUNTRIES[0]
  const local = full.startsWith(country.code)
    ? full.slice(country.code.length)
    : full.replace(/^\+\d{1,3}/, '') // strip any other code
  return { country, local }
}

export function PhoneInput({ value, onChange, id, required, className }: PhoneInputProps) {
  const { country: initialCountry, local: initialLocal } = parse(value)
  const [country, setCountry] = useState<Country>(initialCountry)
  const [local, setLocal] = useState(initialLocal)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync when parent resets value (e.g. modal closes)
  useEffect(() => {
    const { country: c, local: l } = parse(value)
    setCountry(c)
    setLocal(l)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleCountrySelect(c: Country) {
    setCountry(c)
    setOpen(false)
    onChange(c.code + local)
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '')
    setLocal(digits)
    onChange(country.code + digits)
  }

  return (
    <div className={`relative flex h-11 rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 overflow-visible ${className ?? ''}`}>
      {/* Country selector button */}
      <div ref={dropdownRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 h-full px-3 text-sm font-medium border-r border-input hover:bg-muted/50 transition-colors rounded-l-xl"
          aria-label="Seleccionar país"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="text-muted-foreground">{country.code}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 transition-colors text-left ${c.code === country.code ? 'bg-muted/40 font-semibold' : ''}`}
              >
                <span className="text-xl">{c.flag}</span>
                <div>
                  <p className="font-medium leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={handleLocalChange}
        placeholder={country.placeholder}
        required={required}
        maxLength={country.digits}
        className="flex-1 h-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
