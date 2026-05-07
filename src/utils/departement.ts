export function getDepartment(deviceUserId: string) {
  const prefix = Number(deviceUserId.slice(0, 3));

  if (prefix >= 700 && prefix <= 799) {
    return "FIG";
  }

  if (prefix >= 400 && prefix <= 499) {
    return "FIO";
  }

  if (prefix >= 900 && prefix <= 999) {
    return "TKA";
  }

  return "-";
}
