enum Events {
  CONNECT = 'connection',
  JOIN = 'join',
  DISCONNECT = 'disconenct',
  ERROR = 'error',
  LOCK_STAFF = 'lock-staff',
  UN_LOCK_STAFF = 'un-lock-staff',
  LOCK_SERVICE = 'lock-service',
  UN_LOCK_SERVICE = 'un-lock-service',
  LOCK_RESOURCE = 'lock-resource',
  UN_LOCK_RESOURCE = 'un-lock-resource'
}

enum SocketRoomPrefixes {
  APPOINTMENT = 'appointment-'
}

/**
 * Get rooms from array string (ex: workingLocaionIds, ...)
 *
 * @param {string[]} strings
 * @param {SocketRoomPrefixes} roomPrefix
 * @returns {string[]}
 */
const getRoomsFromStrings = (strings: string[], roomPrefix: SocketRoomPrefixes): string[] => {
  if (strings.length < 1) return [];
  const rooms = strings.map((id) => roomPrefix + id);
  return rooms;
};
export { Events, SocketRoomPrefixes, getRoomsFromStrings };
