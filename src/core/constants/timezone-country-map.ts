/**
 * Mapeamento de timezones IANA para códigos ISO de país.
 * Usado para detectar o país do usuário e buscar feriados relevantes.
 */

const timezoneToCountry: Record<string, string> = {
  // Americas
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR',
  'America/Bahia': 'BR', 'America/Belem': 'BR', 'America/Manaus': 'BR',
  'America/Cuiaba': 'BR', 'America/Campo_Grande': 'BR', 'America/Porto_Velho': 'BR',
  'America/Boa_Vista': 'BR', 'America/Noronha': 'BR', 'America/Araguaina': 'BR',
  'America/Maceio': 'BR', 'America/Santarem': 'BR', 'America/Rio_Branco': 'BR',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'America/Phoenix': 'US',
  'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US', 'America/Boise': 'US',
  'America/Juneau': 'US', 'America/Adak': 'US', 'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA',
  'America/Regina': 'CA', 'America/Montreal': 'CA',
  'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Monterrey': 'MX',
  'America/Tijuana': 'MX', 'America/Chihuahua': 'MX', 'America/Merida': 'MX',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR', 'America/Argentina/Tucuman': 'AR',
  'America/Santiago': 'CL', 'America/Punta_Arenas': 'CL',
  'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Caracas': 'VE',
  'America/Guayaquil': 'EC', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY',
  'America/Montevideo': 'UY', 'America/Paramaribo': 'SR', 'America/Cayenne': 'GF',
  'America/Guyana': 'GY', 'America/Panama': 'PA', 'America/Costa_Rica': 'CR',
  'America/Guatemala': 'GT', 'America/Tegucigalpa': 'HN', 'America/El_Salvador': 'SV',
  'America/Managua': 'NI', 'America/Belize': 'BZ', 'America/Havana': 'CU',
  'America/Jamaica': 'JM', 'America/Port-au-Prince': 'HT', 'America/Santo_Domingo': 'DO',
  'America/Puerto_Rico': 'PR', 'America/Port_of_Spain': 'TT',

  // Europe
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT',
  'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT',
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG',
  'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Tallinn': 'EE',
  'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Kiev': 'UA',
  'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR', 'Europe/Belgrade': 'RS',
  'Europe/Zagreb': 'HR', 'Europe/Ljubljana': 'SI', 'Europe/Bratislava': 'SK',
  'Europe/Luxembourg': 'LU', 'Europe/Malta': 'MT', 'Europe/Andorra': 'AD',
  'Europe/Monaco': 'MC', 'Europe/San_Marino': 'SM', 'Europe/Vatican': 'VA',
  'Europe/Tirane': 'AL', 'Europe/Skopje': 'MK', 'Europe/Podgorica': 'ME',
  'Europe/Sarajevo': 'BA', 'Europe/Chisinau': 'MD', 'Europe/Minsk': 'BY',

  // Asia
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID',
  'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Yangon': 'MM', 'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK',
  'Asia/Kolkata': 'IN', 'Asia/Karachi': 'PK', 'Asia/Kathmandu': 'NP',
  'Asia/Tashkent': 'UZ', 'Asia/Almaty': 'KZ', 'Asia/Bishkek': 'KG',
  'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM',
  'Asia/Jerusalem': 'IL', 'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY',
  'Asia/Amman': 'JO', 'Asia/Baghdad': 'IQ', 'Asia/Tehran': 'IR',
  'Asia/Kabul': 'AF', 'Asia/Brunei': 'BN', 'Asia/Ulaanbaatar': 'MN',

  // Africa
  'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE', 'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN',
  'Africa/Algiers': 'DZ', 'Africa/Accra': 'GH', 'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Addis_Ababa': 'ET', 'Africa/Khartoum': 'SD', 'Africa/Maputo': 'MZ',
  'Africa/Luanda': 'AO', 'Africa/Abidjan': 'CI', 'Africa/Dakar': 'SN',

  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ',
  'Pacific/Fiji': 'FJ', 'Pacific/Guam': 'GU', 'Pacific/Port_Moresby': 'PG',
};

/**
 * Retorna o código ISO do país a partir de uma timezone IANA.
 * Retorna null se a timezone não for reconhecida.
 */
export function getCountryFromTimezone(tz: string): string | null {
  return timezoneToCountry[tz] || null;
}

/**
 * Lista de todos os códigos de país suportados pelo mapeamento.
 */
export function getSupportedCountries(): string[] {
  return [...new Set(Object.values(timezoneToCountry))];
}
