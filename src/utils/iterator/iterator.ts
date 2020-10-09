const iterator = (data: any, day: any) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i].weekday === day) {
            const startTime = data[i].startTime;
            const endTime = data[i].endTime;
            const timeOfDay = { startTime,endTime  };
            return timeOfDay;
        }
    }
};
export { iterator };
