export function getPrefixByRole(role: string) {
  switch (role?.toLowerCase()) {
    case "fig":
      return "700";

    case "fio":
      return "400";

    case "fin":
      return "000";

    // ✅ ADMIN SEMUA
    case "admin":
    case "superadmin":
      return null;

    default:
      return null;
  }
}
