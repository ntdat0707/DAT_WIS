db.createUser({
  user: 'bookoke',

  pwd: 'bookoke123',

  roles: [{ role: 'readWrite', db: 'bookoke' }]
});
