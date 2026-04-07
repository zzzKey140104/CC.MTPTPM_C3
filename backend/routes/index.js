function registerRoutes(app) {
  const routes = [
    ['/api/comics', './comics'],
    ['/api/chapters', './chapters'],
    ['/api/auth', './auth'],
    ['/api/users', './users'],
    ['/api/categories', './categories'],
    ['/api/countries', './countries'],
    ['/api/favorites', './favorites'],
    ['/api/likes', './likes'],
    ['/api/history', './history'],
    ['/api/notifications', './notifications'],
    ['/api/comments', './comments'],
    ['/api/admin', './admin'],
    ['/api/ai', './ai'],
    ['/api/payments', './payments']
  ];

  routes.forEach(([prefix, modulePath]) => {
    app.use(prefix, require(modulePath));
  });
}

module.exports = {
  registerRoutes
};
