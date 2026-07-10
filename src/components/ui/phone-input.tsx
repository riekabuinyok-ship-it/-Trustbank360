"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  validatePhone,
  detectCountry,
  PHONE_COUNTRY_LIST,
  getPhoneCode,
  type PhoneValidationResult,
} from "@/lib/phone-validation"

export interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  placeholder?: string
  id?: string
  disabled?: boolean
  className?: string
  defaultCountry?: string
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error: externalError,
  required,
  placeholder,
  id,
  disabled,
  className,
  defaultCountry = "SS",
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = React.useState<string>(defaultCountry)
  const [touched, setTouched] = React.useState(false)
  const [internalError, setInternalError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    if (value) {
      const detected = detectCountry(value)
      if (detected && PHONE_COUNTRY_LIST.some((c) => c.iso === detected)) {
        setSelectedCountry(detected)
      }
    }
  }, [value])

  const localNumber = React.useMemo(() => {
    if (!value) return ""
    const code = getPhoneCode(selectedCountry)
    if (!code) return value
    const stripped = value.replace(/[\s\-().]/g, "")
    if (stripped.startsWith(code)) {
      return stripped.slice(code.length)
    }
    if (stripped.startsWith("0")) {
      return stripped.slice(1)
    }
    return stripped.replace(/^\+?\d{1,3}/, "")
  }, [value, selectedCountry])

  function handleCountryChange(iso: string) {
    setSelectedCountry(iso)
    if (localNumber && localNumber.length >= 3) {
      const code = getPhoneCode(iso)
      if (code) {
        const result = validatePhone(`${code}${localNumber}`)
        if (result.valid) {
          onChange(result.normalized!)
        }
      }
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, "")
    if (raw.length > 12) return

    const code = getPhoneCode(selectedCountry)
    if (!code) return

    if (raw.length === 0) {
      onChange("")
      setInternalError(undefined)
      return
    }

    const full = `${code}${raw}`
    const result = validatePhone(full)

    if (result.valid) {
      onChange(result.normalized!)
      setInternalError(undefined)
    } else {
      onChange(full)
      if (touched && raw.length > 4) {
        setInternalError(result.error)
      } else {
        setInternalError(undefined)
      }
    }
  }

  function handleBlur() {
    setTouched(true)
    if (value) {
      const result = validatePhone(value)
      if (!result.valid) {
        setInternalError(result.error)
      } else {
        setInternalError(undefined)
      }
    }
    onBlur?.()
  }

  const displayError = externalError || internalError
  const country = PHONE_COUNTRY_LIST.find((c) => c.iso === selectedCountry)
  const codeDisplay = country ? country.code : "+211"

  const countryPlaceholders: Record<string, string> = {
    SS: "924 440 899",
    UG: "703 675 890",
    KE: "780 440 899",
  }
  const countryPlaceholder = countryPlaceholders[selectedCountry] || "XXXXXXXXX"

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-2">
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[130px] shrink-0 text-left" id={id ? `${id}-country` : undefined}>
            <SelectValue>
              {country ? `${country.flag} ${codeDisplay}` : "Select"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PHONE_COUNTRY_LIST.map((c) => (
              <SelectItem key={c.iso} value={c.iso}>
                {c.flag} {c.code} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          inputMode="tel"
          placeholder={placeholder || countryPlaceholder}
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          id={id}
          className={cn(displayError && "border-red-500 focus-visible:ring-red-500")}
        />
      </div>
      {displayError && (
        <p className="text-sm text-red-500">{displayError}</p>
      )}
    </div>
  )
}
