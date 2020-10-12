import moment from 'moment';
const dayOfWeek = (day: any) => {
  const dayOfWeekNum = moment(day).day();
  let res;
  switch (dayOfWeekNum) {
    case 0:
      res = 'sunday';
      break;
    case 1:
      res = 'monday';
      break;
    case 2:
      res = 'tuesday';
      break;
    case 3:
      res = 'wednesday';
      break;
    case 4:
      res = 'thursday';
      break;
    case 5:
      res = 'friday';
      break;
    case 6:
      res = 'saturday';
  }
  return res;
};

export { dayOfWeek };
