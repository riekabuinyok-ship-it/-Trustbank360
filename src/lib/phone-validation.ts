export interface PhoneCountry {
  code: string
  name: string
  flag: string
  localLength: number
}

export const PHONE_COUNTRIES: Record<string, PhoneCountry> = {
  SS: { code: "+211", name: "South Sudan", flag: "\u{1F1F8}\u{1F1F8}", localLength: 9 },
  UG: { code: "+256", name: "Uganda", flag: "\u{1F1FA}\u{1F1EC}", localLength: 9 },
  KE: { code: "+254", name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}", localLength: 9 },
}

export const PHONE_COUNTRY_LIST = Object.entries(PHONE_COUNTRIES).map(([iso, c]) => ({
  iso,
  ...c,
}))

const CODE_TO_ISO: Record<string, string> = {
  "+211": "SS",
  "+256": "UG",
  "+254": "KE",
}

function stripPhone(input: string): string {
  return input.replace(/[\s\-().]/g, "")
}

export function detectCountry(phone: string): string | null {
  const cleaned = stripPhone(phone)
  for (const [code, iso] of Object.entries(CODE_TO_ISO)) {
    if (cleaned.startsWith(code)) return iso
  }
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    return null
  }
  return null
}

export function getCountryByCode(code: string): PhoneCountry | null {
  const iso = CODE_TO_ISO[code]
  return iso ? PHONE_COUNTRIES[iso] : null
}

export function getIsoFromCode(code: string): string | null {
  return CODE_TO_ISO[code] || null
}

export function getPhoneCode(iso: string): string | null {
  return PHONE_COUNTRIES[iso]?.code || null
}

export interface PhoneValidationResult {
  valid: boolean
  error?: string
  normalized?: string
  country?: string
}

export function validatePhone(
  phone: string,
  countryCode?: string
): PhoneValidationResult {
  if (!phone || phone.trim() === "") {
    return { valid: false, error: "Phone number is required" }
  }

  const cleaned = stripPhone(phone)

  if (!/^\+?\d*$/.test(cleaned)) {
    return { valid: false, error: "Phone number can only contain digits, spaces, and dashes" }
  }

  let iso: string | null = null
  let subscriberDigits: string | null = null

  if (cleaned.startsWith("+")) {
    const matchedCode = Object.keys(CODE_TO_ISO).find((c) => cleaned.startsWith(c))
    if (!matchedCode) {
      return { valid: false, error: "Unsupported country code" }
    }
    iso = CODE_TO_ISO[matchedCode]
    subscriberDigits = cleaned.slice(matchedCode.length)
  } else if (cleaned.startsWith("0")) {
    if (!countryCode) {
      return {
        valid: false,
        error: "Please select a country to validate this phone number",
      }
    }
    const isoFromCode = getIsoFromCode(countryCode)
    if (!isoFromCode) {
      return { valid: false, error: "Invalid country code" }
    }
    iso = isoFromCode
    subscriberDigits = cleaned.slice(1)
  } else {
    if (countryCode) {
      const isoFromCode = getIsoFromCode(countryCode)
      if (!isoFromCode) {
        return { valid: false, error: "Invalid country code" }
      }
      iso = isoFromCode
      const expectedCode = PHONE_COUNTRIES[isoFromCode].code
      const digitsOnly = cleaned.replace(/^\+/, "")
      const codeDigits = expectedCode.slice(1)
      if (digitsOnly.startsWith(codeDigits)) {
        subscriberDigits = digitsOnly.slice(codeDigits.length)
      } else {
        subscriberDigits = digitsOnly
      }
    } else {
      return {
        valid: false,
        error: "Phone number must start with + or 0",
      }
    }
  }

  if (!iso) {
    return { valid: false, error: "Could not determine country" }
  }

  const country = PHONE_COUNTRIES[iso]
  if (subscriberDigits === null) {
    return { valid: false, error: `Invalid ${country.name} phone number` }
  }

  if (subscriberDigits.length < country.localLength) {
    return {
      valid: false,
      error: `Phone number is too short for ${country.name}`,
    }
  }

  if (subscriberDigits.length > country.localLength) {
    return {
      valid: false,
      error: `Phone number is too long for ${country.name}`,
    }
  }

  if (!/^\d+$/.test(subscriberDigits)) {
    return { valid: false, error: `Invalid ${country.name} phone number` }
  }

  const normalized = `${country.code}${subscriberDigits}`

  return { valid: true, normalized, country: iso }
}

export function normalizePhone(phone: string, countryCode?: string): string | null {
  const result = validatePhone(phone, countryCode)
  return result.valid ? result.normalized! : null
}

export function formatPhoneDisplay(phone: string): string {
  const cleaned = stripPhone(phone)

  for (const [code] of Object.entries(CODE_TO_ISO)) {
    if (cleaned.startsWith(code)) {
      const digits = cleaned.slice(code.length)
      if (digits.length === 9) {
        return `${code} ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      }
    }
  }

  return phone
}
