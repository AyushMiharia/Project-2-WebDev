// middleware/auth.js

export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.path.startsWith("/api")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.redirect("/login");
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    if (req.path.startsWith("/api")) {
      return res.status(403).json({ error: "Admin access required" });
    }
    return res.redirect("/admin/login");
  }
  next();
}
