const iterator = function (data: any, day: any) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].weekday == day) {
            let startTime = data[i].startTime;
            let endTime = data[i].endTime;
            let timeOfDay = { startTime,endTime  };
            return timeOfDay;
        }
    }
}
export { iterator };