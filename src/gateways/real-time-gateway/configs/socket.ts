enum Events {
  CONNECT = 'connection',
  JOIN = 'join',
  DISCONNECT = 'disconenct',
  ERROR = 'error',
  APPOINTMENT_LOCK_DATA = 'appointment-lock-data',
  APPOINTMENT_UN_LOCK_DATA = 'appointment-un-lock-data'
}

enum SocketRoomPrefixes {
  APPOINTMENT = 'appointment'
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
  const rooms = strings.map((id) => roomPrefix + '-' + id);
  return rooms;
};
export { Events, SocketRoomPrefixes, getRoomsFromStrings };
